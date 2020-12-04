import React, { Component, CSSProperties } from 'react'
import { Redirect } from 'react-router-dom'
import Hamborger from '../images/Hamborger.png'

interface IProps {
    isUserLogged: boolean
    userUUID: string
    apiURL: string
    setSelectedBeatmap: (id: string, beatmapfile: string, songfile: string, difficulty: string, difficultylabel: string, notejumpoffset: number, notejumpspeed: number, bpm: number, after?: () => void) => void
}

interface IState {
    maps: Array<any>
    songAudio: File | null
    songImage: File | null
    version: string
    name: string
    subName: string
    artist: string
    environmentName: string
    bpm: number
    shuffle: number
    shufflePeriod: number
    previewStart: number
    previewDuration: number
    songTimeOffset: number
    shouldShowCreate: boolean
    beatmapSets: Array<Array<any>>
    shownBeatmaps: Array<Array<any>>
    shouldShowBMSCreate: Array<boolean>
    shouldShowExtraMenu: Array<boolean>
    bmsType: Array<string>
    beatmapDifs: Array<string>
    beatmapSpeeds: Array<number>
    beatmapOffsets: Array<number>
    shouldShowBeatmapCreate: Array<boolean>
    selectedBeatmapSets: Array<number>
    shouldRedirectToMap: boolean
}

export class Maps extends Component<IProps, IState> {
    state: IState = {
        maps: [],
        songAudio: null,
        songImage: null,
        version: "",
        name: "",
        subName: "",
        artist: "",
        environmentName: "",
        bpm: 0,
        shuffle: 0,
        shufflePeriod: 0,
        previewStart: 0,
        previewDuration: 0,
        songTimeOffset: 0,
        shouldShowCreate: false,
        beatmapSets: [],
        shouldShowBMSCreate: [],
        shouldShowBeatmapCreate: [],
        shouldShowExtraMenu: [],
        bmsType: [],
        beatmapDifs: [],
        beatmapSpeeds: [],
        beatmapOffsets: [],
        selectedBeatmapSets: [],
        shownBeatmaps: [],
        shouldRedirectToMap: false
    }

    onSongAudioChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        if (evt.target.files) {
            this.setState({ songAudio: evt.target.files[0] });
        }
    }

    onSongImageChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        if (evt.target.files) {
            this.setState({ songImage: evt.target.files[0] });
        }
    }

    onVersionChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ version: evt.target.value })
    }

    onNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ name: evt.target.value })
    }

    onSubNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ subName: evt.target.value })
    }

    onArtistChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ artist: evt.target.value })
    }

    onEnvironmentNameChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ environmentName: evt.target.value })
    }

    onBpmChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ bpm: parseInt(evt.target.value) })
    }

    onShuffleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ shuffle: parseInt(evt.target.value) })
    }

    onShufflePeriodChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ shufflePeriod: parseInt(evt.target.value) })
    }

    onPreviewStartChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ previewStart: parseInt(evt.target.value) })
    }

    onPreviewDurationChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ previewDuration: parseInt(evt.target.value) })
    }

    onSongTimeOffsetChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ songTimeOffset: parseInt(evt.target.value) })
    }

    onCreateMap = () => {
        if (this.state.songAudio && this.state.songImage) {
            const formData = new FormData();
            formData.append("audio", this.state.songAudio, this.state.songAudio.name)
            formData.append("coverimage", this.state.songImage, this.state.songImage.name)
            formData.append("uuid", this.props.userUUID)
            formData.append("version", this.state.version)
            formData.append("name", this.state.name)
            formData.append("subname", this.state.subName)
            formData.append("artist", this.state.artist)
            formData.append("environmentname", this.state.environmentName)
            formData.append("bpm", `${this.state.bpm}`)
            formData.append("shuffle", `${this.state.shuffle}`)
            formData.append("shuffleperiod", `${this.state.shufflePeriod}`)
            formData.append("previewstart", `${this.state.previewStart}`)
            formData.append("previewduration", `${this.state.previewDuration}`)
            formData.append("songtimeoffset", `${this.state.songTimeOffset}`)
            fetch(`${this.props.apiURL}/makemap`, { method: "POST", body: formData })
                .then(res => res.json())
                .then(data => data.code === 200 ? this.updateMaps() : null)
                .catch((err) => console.error(err))
        }
    }

    updateMaps = () => {
        this.setState({ maps: [], shouldShowBeatmapCreate: [], bmsType: [], shouldShowBMSCreate: [], beatmapDifs: [], selectedBeatmapSets: [], shouldShowExtraMenu: [] })
        fetch(`${this.props.apiURL}/getmaps?uuid=${this.props.userUUID}`)
            .then(res => res.json())
            .then(data => {
                this.setState({ maps: data.maps });
                data.maps.forEach((map: any, i: number) => {
                    let temp = [...this.state.shouldShowBMSCreate];
                    temp.push(false);
                    let temp2 = [...this.state.bmsType]
                    temp2.push("Standard")
                    let temp3 = [...this.state.shouldShowBeatmapCreate]
                    temp3.push(false)
                    let temp4 = [...this.state.beatmapDifs]
                    temp4.push("Easy")
                    let temp5 = [...this.state.selectedBeatmapSets]
                    temp5.push(0)
                    let temp6 = [...this.state.shouldShowExtraMenu];
                    temp6.push(false)
                    let temp7 = [...this.state.beatmapSpeeds]
                    temp7.push(0)
                    let temp8 = [...this.state.beatmapOffsets]
                    temp8.push(0)
                    this.setState({ beatmapSpeeds: temp7, beatmapOffsets: temp8, shouldShowBeatmapCreate: temp3, bmsType: temp2, shouldShowBMSCreate: temp, beatmapDifs: temp4, selectedBeatmapSets: temp5, shouldShowExtraMenu: temp6 })
                    this.getBeatmapSetData(map.beatmapsetids, i)
                });
            })
    }

    showCreate = (shouldShow: boolean = true) => {
        this.setState({ shouldShowCreate: shouldShow })
    }

    getBeatmapSetData = (bmsIds: Array<string>, index: number) => {
        let tempArr = this.state.beatmapSets;
        if (!tempArr[index]) {
            tempArr[index] = [];
        }
        bmsIds.forEach((bmsid, index2) => {
            fetch(`${this.props.apiURL}/getbeatmapset?bmsid=${bmsid}`)
                .then(res => res.json())
                .then(data => {
                    tempArr[index].push(data.beatmapset)
                    this.setState({ beatmapSets: tempArr }, () => {
                        if (index2 === 0) {
                            this.getBeatmaps(0, index)
                        }
                    })
                });
        });
    }

    getBeatmaps = (beatmapSetIndex: number, mapIndex: number) => {
        this.setState({ shownBeatmaps: [] });
        let tempArr = this.state.shownBeatmaps;
        tempArr[mapIndex] = [];
        this.state.beatmapSets[mapIndex][beatmapSetIndex].beatmapids.forEach((beatmapid: string) => {
            fetch(`${this.props.apiURL}/getbeatmap?beatmapid=${beatmapid}`)
                .then(res => res.json())
                .then(data => {
                    tempArr[mapIndex].push(data.beatmap);
                    tempArr = this.sortMaps(tempArr)
                    this.setState({ shownBeatmaps: tempArr });
                })
        })
    }

    selectBeatmapSet(mapIndex: number, bmsIndex: number) {
        let temp = [...this.state.selectedBeatmapSets];
        temp[mapIndex] = bmsIndex;
        this.setState({ selectedBeatmapSets: temp })
    }

    sortMaps = (maps: Array<any>) => {
        let difficultyOrder = {
            "Easy": 1,
            "Normal": 2,
            "Hard": 3,
            "Expert": 5,
            "ExpertPlus": 8
        }
        let returnArr: Array<any> = []
        maps.forEach(map => {
            map.sort((dif1: any, dif2: any) => {
                let dif1Val = difficultyOrder[(dif1.difficulty as "Easy" | "Normal" | "Hard" | "Expert" | "ExpertPlus")];
                let dif2Val = difficultyOrder[(dif2.difficulty as "Easy" | "Normal" | "Hard" | "Expert" | "ExpertPlus")];
                return dif2Val - dif1Val;
            });
            returnArr.push(map)
        })
        return returnArr;
    }

    onCreateBeatmapSet = (mapId: string, index: number) => {
        fetch(`${this.props.apiURL}/makebeatmapset`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    useruuid: this.props.userUUID,
                    mapid: mapId,
                    type: this.state.bmsType[index]
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.code === 200) {
                    let tempTexts = [...this.state.bmsType]
                    tempTexts[index] = ""
                    let shouldShows = [...this.state.shouldShowBMSCreate]
                    shouldShows[index] = false
                    let things = [...this.state.beatmapSets]
                    if (!things[index]) {
                        things[index] = []
                    }
                    things[index].push(data.beatmapset)
                    this.setState({ bmsType: tempTexts, shouldShowBMSCreate: shouldShows, beatmapSets: things })
                }
            });
    }

    onCreateBeatmap = (beatmapSetID: string, index: number) => {
        fetch(`${this.props.apiURL}/makebeatmap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                useruuid: this.props.userUUID,
                difficulty: this.state.beatmapDifs[index],
                beatmapsetid: beatmapSetID,
                notejumpspeed: this.state.beatmapSpeeds[index],
                notejumpoffset: this.state.beatmapOffsets[index]
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.code === 200) {
                    let temp = [...this.state.shouldShowBeatmapCreate];
                    temp[index] = false;
                    let temp2 = [...this.state.shownBeatmaps];
                    if (!temp2[index]) {
                        temp2[index] = [];
                    }
                    temp2[index].push(data.beatmap)
                    this.setState({ shouldShowBeatmapCreate: temp, shownBeatmaps: temp2 })
                }
            })
    }

    openBeatmap = (setIndex: number, difIndex: number) => {
        let origbeatmap = this.state.shownBeatmaps[setIndex][difIndex];
        let map = this.state.maps[setIndex];
        let beatmap = {
            id: origbeatmap.id,
            beatmapfile: origbeatmap.beatmapfile,
            songfile: map.song,
            difficulty: origbeatmap.difficulty,
            difficultylabel: origbeatmap.difficultylabel,
            notejumpoffset: origbeatmap.notejumpoffset,
            notejumpspeed: origbeatmap.notejumpspeed,
            bpm: map.bpm,
        }
        this.props.setSelectedBeatmap(beatmap.id, beatmap.beatmapfile, beatmap.songfile, beatmap.difficulty, beatmap.difficultylabel, beatmap.notejumpoffset, beatmap.notejumpspeed, beatmap.bpm, () => this.setState({ shouldRedirectToMap: true }))
    }

    downloadMap = (mapID: string) => {
        fetch(`${this.props.apiURL}/bundlemap?mapid=${mapID}&useruuid=${this.props.userUUID}`)
            .then(res => res.blob())
            .then(blob => {
                let file = window.URL.createObjectURL(blob);
                window.location.assign(file);
            })
    }

    deleteMap = (mapID: string) => {
        fetch(`${this.props.apiURL}/deletemap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uuid: this.props.userUUID,
                mapid: mapID
            })
        })
            .then(res => res.json())
            .then(data => data.code === 200 ? this.updateMaps() : null)
    }

    redirectToMap = () => {
        return this.state.shouldRedirectToMap ?
            <Redirect to="/editmap" /> : null
    }

    componentDidMount() {
        if (this.props.isUserLogged) {
            this.updateMaps()
        }
    }

    render() {
        let hideStyle: CSSProperties = {
            visibility: "hidden"
        };
        let showStyle: CSSProperties = {
            visibility: "visible"
        }
        return (
            <>
                {!this.props.isUserLogged ? <Redirect to="/" /> : null}
                <h1>Maps</ h1>
                <button onClick={() => this.showCreate(true)}>Create Map</button>
                <section id="mapContainer">
                    {this.state.maps.map((map, index) => (
                        <article className="map" key={map.id}>
                            <img src={this.props.apiURL + "/static" + map.coverimage} alt="" />
                            <div className="map-titles">
                                <h2 className="map-title">{map.name}</h2>
                                <h3 className="map-subtitle">{map.subname}</h3>
                            </div>
                            <section className="map-bms">
                                <section className="map-bms-tabs">
                                    {this.state.beatmapSets[index] ? this.state.beatmapSets[index].map((ele, bmsi) => <p className={bmsi === this.state.selectedBeatmapSets[index] ? "map-bms-tab selected" : "map-bms-tab"} onClick={() => { this.getBeatmaps(bmsi, index); this.selectBeatmapSet(index, bmsi) }} key={ele.id}>{ele.type}</p>) : null}
                                    <button className="create-bms" onClick={() => { let shows = [...this.state.shouldShowBMSCreate]; shows[index] = !shows[index]; this.setState({ shouldShowBMSCreate: shows }) }}>New Beatmap Set...</button>
                                </section>
                                <div className="map-bms-container">
                                    <section className="map-bms-sets">
                                        {this.state.shownBeatmaps[index] ? this.state.shownBeatmaps[index].map((bm, bmi) =>
                                            <div key={bm.id} className="difficulty">
                                                <p>{bm.difficulty}</p>
                                                <div className="difficulty-controls">
                                                    <button onClick={() => this.openBeatmap(index, bmi)}>Open {bm.difficulty}</button>
                                                </div>
                                            </div>) : null}
                                        <button style={this.state.shouldShowBeatmapCreate[index] ? hideStyle : showStyle} onClick={() => { let shows = [...this.state.shouldShowBeatmapCreate]; shows[index] = !shows[index]; this.setState({ shouldShowBeatmapCreate: shows }) }}>Create Beatmap</button>
                                        <article className="beatmap-create" style={this.state.shouldShowBeatmapCreate[index] ? showStyle : hideStyle}>
                                            <select className="text-input" placeholder="Difficulty..." onChange={evt => { let difs = [...this.state.beatmapDifs]; difs[index] = evt.target.value; this.setState({ beatmapDifs: difs }) }} value={this.state.beatmapDifs[index]}>
                                                <option value="Easy">Easy</option>
                                                <option value="Normal">Normal</option>
                                                <option value="Hard">Hard</option>
                                                <option value="Expert">Expert</option>
                                                <option value="ExpertPlus">ExpertPlus</option>
                                            </select>
                                            <input type="number" placeholder="Note Jump Speed" step="0.1" value={this.state.beatmapSpeeds[index] ? this.state.beatmapSpeeds[index] : undefined} onChange={evt => { let tmp = [...this.state.beatmapSpeeds]; tmp[index] = parseFloat(evt.target.value); this.setState({ beatmapSpeeds: tmp }) }} />
                                            <input type="number" placeholder="Note Jump Offset" step="0.1" value={this.state.beatmapOffsets[index] ? this.state.beatmapOffsets[index] : undefined} onChange={evt => { let tmp = [...this.state.beatmapOffsets]; tmp[index] = parseFloat(evt.target.value); this.setState({ beatmapOffsets: tmp }) }} />
                                            <button onClick={() => this.onCreateBeatmap(this.state.beatmapSets[index][this.state.selectedBeatmapSets[index]].id, index)}>Create Beatmap Set</button>
                                        </article>
                                        <article className="bms-create-modal" style={this.state.shouldShowBMSCreate[index] ? showStyle : hideStyle}>
                                            <div className="bms-create-inputs">
                                                <select className="text-input" placeholder="Beatmap Set Type..." onChange={(evt) => { let types = [...this.state.bmsType]; types[index] = evt.target.value; this.setState({ bmsType: types }) }} value={this.state.bmsType[index]}>
                                                    <option value="Standard">Standard</option>
                                                    <option value="NoArrows">NoArrows</option>
                                                    <option value="OneSaber">OneSaber</option>
                                                </select>
                                                <button onClick={() => this.onCreateBeatmapSet(map.id, index)}>Create Beatmap Set</button>
                                            </div>
                                        </article>
                                    </section>
                                </div>
                            </section>
                            <section className="map-controls">
                                <img src={Hamborger} alt="Logo" onClick={() => { let tmp = [...this.state.shouldShowExtraMenu]; tmp[index] = !tmp[index]; this.setState({ shouldShowExtraMenu: tmp }) }} />
                                <section className="controls" style={this.state.shouldShowExtraMenu[index] ? showStyle : hideStyle}>
                                    <p className="option" onClick={() => this.downloadMap(map.id)}>Download Map</p>
                                    <p className="option" onClick={() => this.deleteMap(map.id)}>Delete Map</p>
                                </section>
                            </section>
                        </article>
                    )
                    )}
                </section>
                <section id="createMapModal" className="form" style={this.state.shouldShowCreate ? showStyle : hideStyle}>
                    <article>
                        <div>
                            <label>Audio File:</label>
                            <input type="file" id="audio" accept=".mp3,.wav,.ogg|audio/*" onChange={this.onSongAudioChange} />
                        </div>
                        <div>
                            <label>Cover Image:</label>
                            <input type="file" accept=".jpg,.png,.jpeg|image/*" onChange={this.onSongImageChange} />
                        </div>
                        <div>
                            <label>Version:</label>
                            <input type="text" className="text-input" placeholder="Version" onChange={this.onVersionChange} value={this.state.version} />
                        </div>
                        <div>
                            <label>Name:</label>
                            <input type="text" className="text-input" placeholder="Name" onChange={this.onNameChange} value={this.state.name} />
                        </div>
                        <div>
                            <label>Subname:</label>
                            <input type="text" className="text-input" placeholder="Subname" onChange={this.onSubNameChange} value={this.state.subName} />
                        </div>
                        <div>
                            <label>Artist:</label>
                            <input type="text" className="text-input" placeholder="Artist" onChange={this.onArtistChange} value={this.state.artist} />
                        </div>
                        <div>
                            <label>Environment Name:</label>
                            <select className="text-input" placeholder="Environment Name" onChange={this.onEnvironmentNameChange} value={this.state.environmentName}>
                                <option value="DefaultEnvironment">Default Environment</option>
                                <option value="OriginsEnvironment">Origins Environment</option>
                                <option value="TriangleEnvironment">Triangle Environment</option>
                                <option value="NiceEnvironment">Nice Environment</option>
                                <option value="BigMirrorEnvironment">Big Mirror Environment</option>
                                <option value="DragonsEnvironment">Dragons Environment</option>
                                <option value="KDAEnvironment">KDA Environment</option>
                                <option value="MonstercatEnvironment">Monstercat Environment</option>
                                <option value="CrabRaveEnvironment">Crab Rave Environment</option>
                                <option value="PanicEnvironment">Panic Environment</option>
                                <option value="RocketEnvironment">Rocket Environment</option>
                                <option value="GreenDayEnvironment">Green Day Environment</option>
                                <option value="GreenDayGrenadeEnvironment">Green Day Grenade Environment</option>
                                <option value="TimbalandEnvironment">Timbaland Environment</option>
                                <option value="FitBeatEnvironment">FitBeat Environment</option>
                                <option value="LinkinParkEnvironment">Linkin Park Environment</option>
                                <option value="BTSEnvironment">BTS Environment</option>
                            </select>
                        </div>
                        <div>
                            <label>BPM:</label>
                            <input type="number" step="0.1" className="text-input" placeholder="BPM" onChange={this.onBpmChange} value={this.state.bpm ? this.state.bpm : undefined} />
                        </div>
                        <div>
                            <label>Shuffle:</label>
                            <input type="number" step="0.1" className="text-input" placeholder="Shuffle" onChange={this.onShuffleChange} value={this.state.shuffle ? this.state.shuffle : undefined} />
                        </div>
                        <div>
                            <label>Shuffle Period:</label>
                            <input type="number" step="0.1" className="text-input" placeholder="Shuffle Period" onChange={this.onShufflePeriodChange} value={this.state.shufflePeriod ? this.state.shufflePeriod : undefined} />
                        </div>
                        <div>
                            <label>Preview Start:</label>
                            <input type="number" step="0.1" className="text-input" placeholder="Preview Start" onChange={this.onPreviewStartChange} value={this.state.previewStart ? this.state.previewStart : undefined} />
                        </div>
                        <div>
                            <label>Preview Duration:</label>
                            <input type="number" step="0.1" className="text-input" placeholder="Preview Duration" onChange={this.onPreviewDurationChange} value={this.state.previewDuration ? this.state.previewDuration : undefined} />
                        </div>
                        <div>
                            <label>Song Time Offset:</label>
                            <input type="number" step="0.1" className="text-input" placeholder="Song Time Offset" onChange={this.onSongTimeOffsetChange} value={this.state.songTimeOffset ? this.state.songTimeOffset : undefined} />
                        </div>
                        <div>
                            <button onClick={() => this.showCreate(false)}>Cancel</button>
                            <button onClick={() => { this.onCreateMap(); this.showCreate(false) }}>Make Map</button>
                        </div>
                    </article>
                </section>
                {this.redirectToMap()}
            </>
        )
    }
}