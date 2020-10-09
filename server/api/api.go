package main

import (
	"bytes"
	"context"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
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
	PassHash     string `json:"password"`
	ProfileImage string `json:"image"`
	Maps         []Map  `json:"maps"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
	//Checks for POST method, otherwise responds with 404
	if r.Method == "POST" {
		//Parses data given as multipart form data(needed for profile image)
		r.ParseMultipartForm(8 << 20)
		//This section gets the file data uploaded and defers closing the File generated
		var buf bytes.Buffer
		file, header, err := r.FormFile("profileimage")
		fileExt := filepath.Ext(header.Filename)
		if checkErr(err, func() { w.Write([]byte("No :)")) }) || !checkFileExtension(fileExt, []string{".jpg", ".png", ".jpeg"}) {
			log.Println("Fail 1")
			return
		}
		defer file.Close()

		//Gets and checks username and passwordhash to check for 0 length
		username := r.FormValue("username")
		password := r.FormValue("password")
		if len(username) <= 0 || len(password) <= 0 {
			log.Println("Fail 2")
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
		testUser := User{userID.String(), username, string(passwordHash), imageFilePath, []Map{}}
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
	//TODO: convert audio to ogg(if not already) and the actual map creation
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
}

func editUser(w http.ResponseWriter, r *http.Request) {
	log.Println(uuid.NewUUID())
}

func removeUser(w http.ResponseWriter, r *http.Request) {

}

func getUser(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello"))
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
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
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

func handleRequests() {
	mux := http.NewServeMux()
	mux.HandleFunc("/getuser", getUser)
	mux.HandleFunc("/insertuser", createUser)
	mux.HandleFunc("/testuuid", editUser)
	log.Fatal(http.ListenAndServe(":10000", mux))
}

func main() {
	handleRequests()
}
