package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

//Beatmap is the playable part of a Map, and is part of a BeatmapSet
type Beatmap struct {
	Difficulty      string `json:"difficulty"`
	BeatmapFile     string `json:"beatmapfile"`
	NoteJumpSpeed   int16  `json:"notejumpspeed"`
	NoteJumpOffset  int16  `json:"notejumpoffset"`
	DifficultyLabel string `json:"difficultylabel,omitempty"`
}

//BeatmapSet is a set of beatmaps for a certain type of gameplay
type BeatmapSet struct {
	Type               string    `json:"type"`
	DifficultyBeatmaps []Beatmap `json:"beatmaps"`
}

//Map struct to represent a map contained by a user in the db
type Map struct {
	ID              string       `json:"id"`
	Version         string       `json:"version"`
	Name            string       `json:"name"`
	Subname         string       `json:"subname,omitempty"`
	Artist          string       `json:"artist"`
	Creator         string       `json:"creator"`
	CoverImage      string       `json:"coverimage"`
	EnvironmentName string       `json:"environmentname"`
	Song            string       `json:"song"`
	Bpm             int16        `json:"bpm"`
	Shuffle         int16        `json:"shuffle"`
	ShufflePeriod   int16        `json:"shuffleperiod"`
	PreviewStart    int32        `json:"previewstart"`
	PreviewDuration int32        `json:"previewduration"`
	SongTimeOffset  int32        `json:"songtimeoffset"`
	BeatmapSets     []BeatmapSet `json:"beatmapsets"`
}

//User struct to represent a user in the db
type User struct {
	UUID         string `json:"uuid"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	PassHash     string `json:"password"`
	ProfileImage string `json:"image"`
	Maps         []Map  `json:"maps"`
}

//GeneralResponse represents a JSON response back to the client on failure
type GeneralResponse struct {
	Code    int16  `json:"code"`
	Message string `json:"message"`
}

//LoginResponse represents JSON response back to client on login
type LoginResponse struct {
	Code    int16  `json:"code"`
	Message string `json:"message"`
	User    User   `json:"user"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
	//Prepare header for json response
	w.Header().Set("Content-Type", "application/json")
	//Checks for POST method, otherwise responds with 404
	if r.Method == "POST" {
		//Parses data given as multipart form data(needed for profile image)
		r.ParseMultipartForm(8 << 20)
		//This section gets the file data uploaded and defers closing the File generated
		var buf bytes.Buffer
		file, header, err := r.FormFile("profileimage")
		if checkErr(err, func() {
			if err.Error() == "http: no such file" {
				json.NewEncoder(w).Encode(GeneralResponse{400, "Please upload a jpg png or jpeg < 8MB"})
			} else {
				json.NewEncoder(w).Encode(GeneralResponse{500, "Failure uploading image. Please try again in 1 minute"})
			}
		}) {
			return
		}
		fileExt := filepath.Ext(header.Filename)
		if !checkFileExtension(fileExt, []string{".jpg", ".png", ".jpeg"}) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please upload a jpg png or jpeg < 8MB"})
			return
		}
		defer file.Close()

		//Gets and checks username and passwordhash to check for 0 length
		username := r.FormValue("username")
		password := r.FormValue("password")
		email := r.FormValue("email")
		if isStringEmpty(username) || isStringEmpty(password) || isStringEmpty(email) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please include a username, email, and password"})
			return
		}
		passwordHash := hashPass([]byte(password))
		//This chunk writes the image uploaded to machine storage to be used later
		imageID, _ := uuid.NewUUID()
		imageIDString := imageID.String()
		imageFilePath := "./image/" + imageIDString + fileExt
		io.Copy(&buf, file)
		ioutil.WriteFile(imageFilePath, buf.Bytes(), 0644)

		//Inserts user into DB with generated uuid
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		userID, _ := uuid.NewUUID()
		testUser := User{userID.String(), username, email, string(passwordHash), imageFilePath[1:], []Map{}}
		coll := client.Database("bsbma").Collection("users")
		_, err = coll.InsertOne(context.TODO(), testUser)
		if err != nil {
			log.Fatal(err)
		}
		client.Disconnect(ctx)

		//Writes success back
		w.Write([]byte("Inserted"))
	} else {
		w.Write([]byte("404 Page not found"))
	}
}

func makeMap(w http.ResponseWriter, r *http.Request) {
	//Handles song upload. Was done early because of profile image code.
	r.ParseMultipartForm(32 << 20)
	var buf bytes.Buffer
	file, _, err := r.FormFile("audio")
	if err != nil {
		w.Write([]byte("No :)"))
		return
	}
	defer file.Close()
	songid, _ := uuid.NewUUID()
	songidString := songid.String()
	io.Copy(&buf, file)
	ioutil.WriteFile(songidString+".mp3", buf.Bytes(), 0644)
	//TODO: convert audio to ogg(if not already) and the actual map creation
}

func editUser(w http.ResponseWriter, r *http.Request) {

}

func removeUser(w http.ResponseWriter, r *http.Request) {
	//Prepare header for json response
	w.Header().Set("Content-Type", "application/json")
	//Assure method is DELETE
	if r.Method == "DELETE" {
		//Parse data from params
		r.ParseForm()
		//Get and check required params
		uuid := r.Form.Get("uuid")
		if isStringEmpty(uuid) {
			errResp, _ := json.Marshal(GeneralResponse{400, "Please provide valid username and password"})
			w.Write(errResp)
			return
		}
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		coll := client.Database("bsbma").Collection("users")
		var foundUser User
		coll.FindOne(context.TODO(), bson.M{"uuid": uuid}).Decode(&foundUser)
		_, err := coll.DeleteOne(context.TODO(), bson.M{"uuid": uuid})
		if err != nil {
			log.Println("Error deleting: " + uuid)
			errResp, _ := json.Marshal(GeneralResponse{500, "Internal Server Error."})
			w.Write(errResp)
			return
		}
		err = os.Remove("." + foundUser.ProfileImage)
		if err != nil {
			log.Println(err)
		}
	}
}

func getUser(w http.ResponseWriter, r *http.Request) {
	//Prepare header for json response
	w.Header().Set("Content-Type", "application/json")
	//Assure method is GET
	if r.Method == "GET" {
		//Parse data from params
		r.ParseForm()
		//Get and check for required fields
		userID := r.Form.Get("userid")
		password := r.Form.Get("password")
		if isStringEmpty(userID) || isStringEmpty(password) {
			errResp, _ := json.Marshal(GeneralResponse{400, "Please provide valid username and password"})
			w.Write(errResp)
			return
		}
		emailRegex := regexp.MustCompile(`^(?:[A-Za-z0-9!#$%&'*+\-/=?^_` + "`" + `{|}~])(?:\.?[A-Za-z0-9!#$%&'*+\-/=?^_` + "`" + `{|}~]+)+\@(?:[A-Za-z0-9!#$%&'*+\-/=?^_` + "`" + `{|}~]+)(?:\.?[A-Za-z0-9!#$%&'*+\-/=?^_` + "`" + `{|}~])+$`)
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		coll := client.Database("bsbma").Collection("users")
		var foundUser User
		var err error
		if emailRegex.Match([]byte(userID)) {
			err = coll.FindOne(context.TODO(), bson.M{"email": userID}).Decode(&foundUser)
		} else {
			err = coll.FindOne(context.TODO(), bson.M{"username": userID}).Decode(&foundUser)
		}
		if err != nil {
			log.Println("Error logging in: " + userID + ":" + password)
			errResp, _ := json.Marshal(GeneralResponse{500, "Internal Server Error."})
			w.Write(errResp)
			return
		}
		err = bcrypt.CompareHashAndPassword([]byte(foundUser.PassHash), []byte(password))
		if err != nil {
			errResp, _ := json.Marshal(GeneralResponse{400, "Please provide valid username/email & password combination"})
			w.Write(errResp)
			return
		}
		resp, _ := json.Marshal(LoginResponse{200, "OK", foundUser})
		w.Write(resp)
	} else {
		w.Write([]byte("404 Page not found"))
	}
}

func getDbConnection() (*mongo.Client, context.Context) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}
	dbURI := os.Getenv("DBURI")
	client, err := mongo.NewClient(options.Client().ApplyURI(dbURI))
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 1000*time.Second)
	defer cancel()
	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}
	return client, ctx
}

func hashPass(pass []byte) []byte {
	hash, err := bcrypt.GenerateFromPassword(pass, bcrypt.MinCost)
	checkErr(err, func() { log.Fatal(err) })
	return hash
}

func checkErr(err error, action func()) bool {
	if err != nil {
		action()
		return true
	}
	return false
}

func checkFileExtension(extensionToCheck string, validExtensions []string) bool {
	for _, ext := range validExtensions {
		if ext == extensionToCheck {
			return true
		}
	}
	return false
}

func isStringEmpty(str string) bool {
	return len(str) <= 0
}

func handleRequests() {
	http.Handle("/static/image", http.FileServer(http.Dir("./image")))
	http.HandleFunc("/getuser", getUser)
	http.HandleFunc("/insertuser", createUser)
	http.HandleFunc("/deleteuser", removeUser)
	log.Fatal(http.ListenAndServe(":10000", nil))
}

func main() {
	handleRequests()
}
