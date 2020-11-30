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
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
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
	ID              string `json:"id"`
	Difficulty      string `json:"difficulty"`
	BeatmapFile     string `json:"beatmapfile"`
	NoteJumpSpeed   int16  `json:"notejumpspeed"`
	NoteJumpOffset  int16  `json:"notejumpoffset"`
	DifficultyLabel string `json:"difficultylabel,omitempty"`
}

//BeatmapSet is a set of beatmaps for a certain type of gameplay
type BeatmapSet struct {
	ID                   string   `json:"id"`
	Type                 string   `json:"type"`
	DifficultyBeatmapIds []string `json:"beatmapids"`
}

//Map struct to represent a map contained by a user in the db
type Map struct {
	ID              string   `json:"id"`
	Version         string   `json:"version"`
	Name            string   `json:"name"`
	Subname         string   `json:"subname,omitempty"`
	Artist          string   `json:"artist"`
	Creator         string   `json:"creator"`
	CoverImage      string   `json:"coverimage"`
	EnvironmentName string   `json:"environmentname"`
	Song            string   `json:"song"`
	Bpm             int      `json:"bpm"`
	Shuffle         int      `json:"shuffle"`
	ShufflePeriod   int      `json:"shuffleperiod"`
	PreviewStart    int      `json:"previewstart"`
	PreviewDuration int      `json:"previewduration"`
	SongTimeOffset  int      `json:"songtimeoffset"`
	BeatmapSetIDs   []string `json:"beatmapsetids"`
}

//User struct to represent a user in the db
type User struct {
	UUID         string   `json:"uuid"`
	Username     string   `json:"username"`
	Email        string   `json:"email"`
	PassHash     string   `json:"password"`
	ProfileImage string   `json:"image"`
	MapIds       []string `json:"mapids"`
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

//MapResponse represents JSON response back to client on user map inquiry
type MapResponse struct {
	Code    int16  `json:"code"`
	Message string `json:"message"`
	Maps    []Map  `json:"maps"`
}

//BeatmapSetResponse represents JSON response back to client on user BeatmapSet inquiry
type BeatmapSetResponse struct {
	Code       int16      `json:"code"`
	Message    string     `json:"message"`
	BeatmapSet BeatmapSet `json:"beatmapset"`
}

//BeatmapResponse represents JSON response back to client on user BeatmapSet inquiry
type BeatmapResponse struct {
	Code    int16   `json:"code"`
	Message string  `json:"message"`
	Beatmap Beatmap `json:"beatmap"`
}

func deleteMap(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == "POST" {
		var form struct {
			UUID  string `json:"uuid"`
			MapID string `json:"mapid"`
		}
		err := json.NewDecoder(r.Body).Decode(&form)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid uuid and mapid combo"})
			return
		}
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		var user User
		coll := client.Database("bsbma").Collection("users")
		coll.FindOne(context.TODO(), bson.M{"uuid": form.UUID}).Decode(&user)
		if !userContainsMap(user, form.MapID) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid uuid and mapid combo"})
			return
		}
		update := bson.D{{Key: "$pull", Value: bson.D{{Key: "mapids", Value: form.MapID}}}}
		coll.UpdateOne(context.TODO(), bson.M{"uuid": form.UUID}, update)
		coll = client.Database("bsbma").Collection("maps")
		var delMap Map
		coll.FindOne(context.TODO(), bson.M{"id": form.MapID}).Decode(&delMap)
		mapImagePath := "." + delMap.CoverImage
		songPath := "." + delMap.Song
		os.Remove(mapImagePath)
		os.Remove(songPath)
		coll.DeleteOne(context.TODO(), bson.M{"id": form.MapID})
		for _, bmsetid := range delMap.BeatmapSetIDs {
			var bmset BeatmapSet
			coll = client.Database("bsbma").Collection("beatmapsets")
			coll.FindOne(context.TODO(), bson.M{"id": bmsetid}).Decode(&bmset)
			for _, dbmid := range bmset.DifficultyBeatmapIds {
				coll = client.Database("bsbma").Collection("beatmaps")
				coll.DeleteOne(context.TODO(), bson.M{"id": dbmid})
			}
			coll = client.Database("bsbma").Collection("beatmapsets")
			coll.DeleteOne(context.TODO(), bson.M{"id": bmsetid})
		}
	}
}

func createUser(w http.ResponseWriter, r *http.Request) {
	//Prepare header for json response
	setHeaders(w)
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
		coll := client.Database("bsbma").Collection("users")
		userID, _ := uuid.NewUUID()
		testUser := User{userID.String(), username, email, string(passwordHash), "/static" + imageFilePath[1:], []string{}}
		_, err = coll.InsertOne(context.TODO(), testUser)
		if err != nil {
			log.Fatal(err)
		}
		client.Disconnect(ctx)

		//Writes success back
		json.NewEncoder(w).Encode(GeneralResponse{200, "Ok"})
	} else {
		w.Write([]byte("404 Page not found"))
	}
}

func getUserMaps(w http.ResponseWriter, r *http.Request) {
	//Prepare header for json response
	setHeaders(w)
	//Assure method is GET
	if r.Method == "GET" {
		//Parse data from params
		r.ParseForm()
		//Get and check for required fields
		userUUID := r.Form.Get("uuid")
		if isStringEmpty(userUUID) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid username and password"})
			return
		}
		var user User
		maps := []Map{}
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		coll := client.Database("bsbma").Collection("users")
		coll.FindOne(context.TODO(), bson.M{"uuid": userUUID}).Decode(&user)
		coll = client.Database("bsbma").Collection("maps")
		for _, mapid := range user.MapIds {
			var userMap Map
			coll.FindOne(context.TODO(), bson.M{"id": mapid}).Decode(&userMap)
			maps = append(maps, userMap)
		}
		json.NewEncoder(w).Encode(MapResponse{200, "Ok", maps})
	} else {
		w.Write([]byte("404 Not Found"))
	}
}

func makeMap(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == "POST" {
		//Handles song upload. Was done early because of profile image code.
		r.ParseMultipartForm(32 << 20)
		var buf bytes.Buffer
		file, header, err := r.FormFile("audio")
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Error Uploading Audio, Please wait a minute and try again"})
			return
		}
		defer file.Close()
		imagefile, imageheader, err := r.FormFile("coverimage")
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Error Uploading Cover Image, Please wait a minute and try again"})
			return
		}
		imageExt := filepath.Ext(imageheader.Filename)
		if !checkFileExtension(imageExt, []string{".jpg", ".png", ".jpeg"}) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please upload a jpg png or jpeg < 8MB"})
			return
		}
		defer imagefile.Close()
		mapid, _ := uuid.NewUUID()
		mapidstring := mapid.String()
		userUUID := r.FormValue("uuid")
		version := r.FormValue("version")
		name := r.FormValue("name")
		subname := r.FormValue("subname")
		artist := r.FormValue("artist")
		environmentName := r.FormValue("environmentname")
		bpm := r.FormValue("bpm")
		shuffle := r.FormValue("shuffle")
		shufflePeriod := r.FormValue("shuffleperiod")
		previewStart := r.FormValue("previewstart")
		previewDuration := r.FormValue("previewduration")
		songTimeOffset := r.FormValue("songtimeoffset")
		if isStringEmpty(userUUID) || isStringEmpty(version) || isStringEmpty(name) || isStringEmpty(artist) || isStringEmpty(environmentName) || isStringEmpty(bpm) || isStringEmpty(shuffle) || isStringEmpty(shufflePeriod) || isStringEmpty(previewStart) || isStringEmpty(previewDuration) || isStringEmpty(songTimeOffset) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please include valid fields"})
			return
		}
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		coll := client.Database("bsbma").Collection("users")
		var user User
		coll.FindOne(context.TODO(), bson.M{"uuid": userUUID}).Decode(&user)
		if isStringEmpty(user.UUID) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Invalid User UUID"})
			return
		}
		if len(user.MapIds) > 3 {
			json.NewEncoder(w).Encode(GeneralResponse{400, "You already have created the maximum amount of maps you can"})
			return
		}
		bpmInt, err := strconv.Atoi(bpm)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please include valid bpm"})
			return
		}
		shuffleInt, err := strconv.Atoi(shuffle)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please include valid shuffle"})
			return
		}
		shufflePeriodInt, err := strconv.Atoi(shufflePeriod)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please include valid shuffle period"})
			return
		}
		previewStartInt, err := strconv.Atoi(previewStart)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please include valid preview start"})
			return
		}
		previewDurationInt, err := strconv.Atoi(previewDuration)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please include valid preview duration"})
			return
		}
		songTimeOffsetInt, err := strconv.Atoi(songTimeOffset)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please include valid song time offset"})
			return
		}
		songid, _ := uuid.NewUUID()
		songidString := songid.String()
		songFilePath := "./audio/" + songidString + ".ogg"
		io.Copy(&buf, file)
		rawFilePath := "./audio/" + header.Filename
		ioutil.WriteFile(rawFilePath, buf.Bytes(), 0644)
		cmd := exec.Command("ffmpeg", "-i", rawFilePath, songFilePath)
		err = cmd.Run()
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Error Uploading Audio, Please wait a minute and try again"})
			log.Println("Error transcoding through ffmpeg. Make sure ffmpeg is installed. If you aren't a dev and seeing this be scared.")
			log.Println(err)
			os.Remove(rawFilePath)
			return
		}
		os.Remove(rawFilePath)
		imageid, _ := uuid.NewUUID()
		imageidString := imageid.String()
		imageFilePath := "./image/" + imageidString + imageExt
		io.Copy(&buf, imagefile)
		ioutil.WriteFile(imageFilePath, buf.Bytes(), 0644)
		createdMap := Map{mapidstring, version, name, subname, artist, user.Username, imageFilePath[1:], environmentName, songFilePath[1:], bpmInt, shuffleInt, shufflePeriodInt, previewStartInt, previewDurationInt, songTimeOffsetInt, []string{}}
		update := bson.D{{Key: "$push", Value: bson.D{{Key: "mapids", Value: mapidstring}}}}
		coll.UpdateOne(context.TODO(), bson.M{"uuid": userUUID}, update)
		client.Disconnect(ctx)
		client, ctx = getDbConnection()
		defer client.Disconnect(ctx)
		coll = client.Database("bsbma").Collection("maps")
		coll.InsertOne(context.TODO(), createdMap)
		json.NewEncoder(w).Encode(GeneralResponse{200, "Ok"})
	} else {
		w.Write([]byte("404 Not Found"))
	}
}

func makeBeatmapSet(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == "POST" {
		var form struct {
			UserUUID string `json:"useruuid"`
			MapID    string `json:"mapid"`
			Type     string `json:"type"`
		}
		err := json.NewDecoder(r.Body).Decode(&form)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide necessary information"})
			return
		}
		if isStringEmpty(form.UserUUID) || isStringEmpty(form.MapID) || isStringEmpty(form.Type) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide necessary information"})
			return
		}
		var user User
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		coll := client.Database("bsbma").Collection("users")
		coll.FindOne(context.TODO(), bson.M{"uuid": form.UserUUID}).Decode(&user)
		if user.UUID != form.UserUUID || !userContainsMap(user, form.MapID) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid user uuid and map id"})
			return
		}
		client.Disconnect(ctx)
		var selectedMap Map
		client, ctx = getDbConnection()
		defer client.Disconnect(ctx)
		coll = client.Database("bsbma").Collection("maps")
		coll.FindOne(context.TODO(), bson.M{"id": form.MapID}).Decode(&selectedMap)
		client.Disconnect(ctx)
		client, ctx = getDbConnection()
		defer client.Disconnect(ctx)
		coll = client.Database("bsbma").Collection("beatmapsets")
		var beatmapset BeatmapSet
		for _, beatmapsetid := range selectedMap.BeatmapSetIDs {
			coll.FindOne(context.TODO(), bson.M{"id": beatmapsetid}).Decode(&beatmapset)
			if beatmapset.Type == form.Type {
				json.NewEncoder(w).Encode(GeneralResponse{400, "Beatmap Set with given Type already exists for this map"})
				return
			}
		}
		beatmapsetUUID, _ := uuid.NewUUID()
		beatmapsetString := beatmapsetUUID.String()
		beatmapset = BeatmapSet{beatmapsetString, form.Type, []string{}}
		coll.InsertOne(context.TODO(), beatmapset)
		client.Disconnect(ctx)
		client, ctx = getDbConnection()
		defer client.Disconnect(ctx)
		coll = client.Database("bsbma").Collection("maps")
		update := bson.D{{Key: "$push", Value: bson.D{{Key: "beatmapsetids", Value: beatmapsetString}}}}
		coll.UpdateOne(context.TODO(), bson.M{"id": form.MapID}, update)
		json.NewEncoder(w).Encode(BeatmapSetResponse{200, "Okay", beatmapset})
	}
}

func getBeatmapSet(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == "GET" {
		//Parse data from params
		r.ParseForm()
		//Get and check for required fields
		bmsid := r.Form.Get("bmsid")
		if isStringEmpty(bmsid) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid Beatmap Set Id"})
			return
		}
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		var beatmapSet BeatmapSet
		coll := client.Database("bsbma").Collection("beatmapsets")
		coll.FindOne(context.TODO(), bson.M{"id": bmsid}).Decode(&beatmapSet)
		json.NewEncoder(w).Encode(BeatmapSetResponse{200, "Ok", beatmapSet})
	} else {
		w.Write([]byte("404 Not Found"))
	}
}

func getBeatmap(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == "GET" {
		//Parse data from params
		r.ParseForm()
		//Get and check for required fields
		beatmapid := r.Form.Get("beatmapid")
		if isStringEmpty(beatmapid) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid Beatmap Set Id"})
			return
		}
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		var beatmap Beatmap
		coll := client.Database("bsbma").Collection("beatmaps")
		coll.FindOne(context.TODO(), bson.M{"id": beatmapid}).Decode(&beatmap)
		json.NewEncoder(w).Encode(BeatmapResponse{200, "Ok", beatmap})
	} else {
		w.Write([]byte("404 Not Found"))
	}
}

func makeBeatmap(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == "POST" {
		var form struct {
			UserUUID          string `json:"useruuid"`
			BeatmapDifficulty string `json:"difficulty"`
			BeatmapSetID      string `json:"beatmapsetid"`
		}
		err := json.NewDecoder(r.Body).Decode(&form)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide necessary information"})
			return
		}
		if isStringEmpty(form.UserUUID) || isStringEmpty(form.BeatmapDifficulty) || isStringEmpty(form.BeatmapSetID) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide necessary information"})
			return
		}
		beatmapUUID, _ := uuid.NewUUID()
		beatmapUUIDString := beatmapUUID.String()
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		coll := client.Database("bsbma").Collection("beatmapsets")
		update := bson.D{{Key: "$push", Value: bson.D{{Key: "difficultybeatmapids", Value: beatmapUUIDString}}}}
		coll.UpdateOne(context.TODO(), bson.M{"id": form.BeatmapSetID}, update)
		client.Disconnect(ctx)
		client, ctx = getDbConnection()
		defer client.Disconnect(ctx)
		coll = client.Database("bsbma").Collection("beatmaps")
		beatmap := Beatmap{beatmapUUIDString, form.BeatmapDifficulty, "", 15, 15, form.BeatmapDifficulty}
		coll.InsertOne(context.TODO(), beatmap)
		json.NewEncoder(w).Encode(BeatmapResponse{200, "OK", beatmap})
	} else {
		w.Write([]byte("404 Not Found"))
	}
}

func saveBeatmap(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == "POST" {
		var form struct {
			BeatmapID   string `json:"beatmapid"`
			BeatmapInfo string `json:"beatmapinfo"`
		}
		err := json.NewDecoder(r.Body).Decode(&form)
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide necessary information"})
			return
		}
		rawFilePath := "./beatmaps/" + form.BeatmapID + ".dat"
		err = ioutil.WriteFile(rawFilePath, []byte(form.BeatmapInfo), 0644)
		if err != nil {
			log.Println(err)
		}
		json.NewEncoder(w).Encode(GeneralResponse{200, "OK"})
	}
}

func editUser(w http.ResponseWriter, r *http.Request) {
	//Prepare header for json response
	setHeaders(w)
	//Assure method is PUT
	if r.Method == "PUT" {
		//Parse data from body
		r.ParseMultipartForm(32 << 20)
		//Get body fields
		reqUUID := r.Form.Get("uuid")
		username := r.Form.Get("username")
		oldPass := r.Form.Get("oldpass")
		newPass := r.Form.Get("newpass")
		email := r.Form.Get("email")
		file, header, err := r.FormFile("profileimage")
		//Check minimum required fields
		if isStringEmpty(reqUUID) || isStringEmpty(username) || isStringEmpty(oldPass) || isStringEmpty(email) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide necessary fields"})

		}
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		coll := client.Database("bsbma").Collection("users")
		var oldUser User
		coll.FindOne(context.TODO(), bson.M{"uuid": reqUUID}).Decode(&oldUser)
		isOldPassCorrectErr := bcrypt.CompareHashAndPassword([]byte(oldUser.PassHash), []byte(oldPass))
		if isOldPassCorrectErr != nil {
			log.Println("Unauthorized edit attempt on user: " + oldUser.UUID)
			json.NewEncoder(w).Encode(GeneralResponse{401, "Unauthorized"})
			return
		}
		if err != nil {
			if isStringEmpty(newPass) {
				update := bson.D{{Key: "$set", Value: bson.D{{Key: "username", Value: username}, {Key: "email", Value: email}}}}
				coll.UpdateOne(context.TODO(), bson.M{"uuid": reqUUID}, update)
			} else {
				newHash := hashPass([]byte(newPass))
				update := bson.D{{Key: "$set", Value: bson.D{{Key: "username", Value: username}, {Key: "email", Value: email}, {Key: "passhash", Value: string(newHash)}}}}
				coll.UpdateOne(context.TODO(), bson.M{"uuid": reqUUID}, update)
			}
		} else {
			fileExt := filepath.Ext(header.Filename)
			if !checkFileExtension(fileExt, []string{".jpg", ".png", ".jpeg"}) {
				json.NewEncoder(w).Encode(GeneralResponse{400, "Please upload a jpg png or jpeg < 8MB"})
				return
			}
			var buf bytes.Buffer
			newImageID, _ := uuid.NewUUID()
			newImageIDString := newImageID.String()
			newImageFilePath := "./image/" + newImageIDString + fileExt
			io.Copy(&buf, file)
			ioutil.WriteFile(newImageFilePath, buf.Bytes(), 0644)
			defer file.Close()
			oldFilePath := oldUser.ProfileImage[7:]
			os.Remove("." + oldFilePath)
			if isStringEmpty(newPass) {
				update := bson.D{{Key: "$set", Value: bson.D{{Key: "username", Value: username}, {Key: "email", Value: email}, {Key: "profileimage", Value: newImageFilePath[1:]}}}}
				coll.UpdateOne(context.TODO(), bson.M{"uuid": reqUUID}, update)
			} else {
				newHash := hashPass([]byte(newPass))
				update := bson.D{{Key: "$set", Value: bson.D{{Key: "username", Value: username}, {Key: "email", Value: email}, {Key: "profileimage", Value: newImageFilePath[1:]}, {Key: "passhash", Value: string(newHash)}}}}
				coll.UpdateOne(context.TODO(), bson.M{"uuid": reqUUID}, update)
			}
		}
	}

}

func removeUser(w http.ResponseWriter, r *http.Request) {
	//Prepare header for json response
	setHeaders(w)
	//Assure method is DELETE
	if r.Method == "DELETE" {
		//Parse data from params
		r.ParseForm()
		//Get and check required params
		uuid := r.Form.Get("uuid")
		if isStringEmpty(uuid) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid username and password"})
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
			json.NewEncoder(w).Encode(GeneralResponse{500, "Internal Server Error. Please try again in 1 minute"})

			return
		}
		if !isStringEmpty(foundUser.ProfileImage) {
			filePath := foundUser.ProfileImage[7:]
			err = os.Remove("." + filePath)
			if err != nil {
				log.Println(err)
			}
		}
		json.NewEncoder(w).Encode(GeneralResponse{200, "OK"})
	}
}

func getUser(w http.ResponseWriter, r *http.Request) {
	//Prepare header for json response
	setHeaders(w)
	//Assure method is GET
	if r.Method == "GET" {
		//Parse data from params
		r.ParseForm()
		//Get and check for required fields
		userID := r.Form.Get("userid")
		password := r.Form.Get("password")
		if isStringEmpty(userID) || isStringEmpty(password) {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid username and password"})
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
			json.NewEncoder(w).Encode(GeneralResponse{500, "Internal Server Error. Please try again in 1 minute"})

			return
		}
		err = bcrypt.CompareHashAndPassword([]byte(foundUser.PassHash), []byte(password))
		if err != nil {
			json.NewEncoder(w).Encode(GeneralResponse{400, "Please provide valid username/email & password combination"})
			return
		}
		json.NewEncoder(w).Encode(LoginResponse{200, "OK", foundUser})
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

func setHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
}

func userContainsMap(user User, mapID string) bool {
	for _, id := range user.MapIds {
		if id == mapID {
			return true
		}
	}
	return false
}

func handleRequests() {
	http.Handle("/static/image/", http.StripPrefix("/static/image/", http.FileServer(http.Dir("./image"))))
	http.Handle("/static/audio/", http.StripPrefix("/static/audio/", http.FileServer(http.Dir("./audio"))))
	http.HandleFunc("/getuser", getUser)
	http.HandleFunc("/insertuser", createUser)
	http.HandleFunc("/deleteuser", removeUser)
	http.HandleFunc("/edituser", editUser)
	http.HandleFunc("/makemap", makeMap)
	http.HandleFunc("/makebeatmap", makeBeatmap)
	http.HandleFunc("/makebeatmapset", makeBeatmapSet)
	http.HandleFunc("/getmaps", getUserMaps)
	http.HandleFunc("/deletemap", deleteMap)
	http.HandleFunc("/getbeatmapset", getBeatmapSet)
	http.HandleFunc("/getbeatmap", getBeatmap)
	http.HandleFunc("/savebeatmap", saveBeatmap)
	log.Fatal(http.ListenAndServe(":10000", nil))
}

func main() {
	handleRequests()
}
