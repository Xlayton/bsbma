package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

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
	log.Println(r.Method)
	switch r.Method {
	case "POST":
		client, ctx := getDbConnection()
		defer client.Disconnect(ctx)
		testUser := User{"1", "Fake", "NotReal", "test.jpg", []Map{}}
		coll := client.Database("bsbma").Collection("users")
		insertRes, err := coll.InsertOne(context.TODO(), testUser)
		if err != nil {
			log.Fatal(err)
		}

		log.Println("Inserted user with mongo uid: ", insertRes.InsertedID)
		client.Disconnect(ctx)
		w.Write([]byte("Inserted"))
		break
	default:
		w.Write([]byte("404 Page not found"))
	}

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
