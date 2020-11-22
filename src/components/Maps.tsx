import React, { Component, CSSProperties } from 'react'
import { Redirect } from 'react-router-dom'

interface IProps {
    isUserLogged: boolean
    userUUID: string
    apiURL: string
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
        shouldShowCreate: false
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

    onEnvironmentNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
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
        fetch(`${this.props.apiURL}/getmaps?uuid=${this.props.userUUID}`)
            .then(res => res.json())
            .then(data => { this.setState({ maps: data.maps }); console.log(data) })
    }

    showCreate = (shouldShow: boolean = true) => {
        this.setState({ shouldShowCreate: shouldShow })
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
                    {this.state.maps.map(map => (
                        <article className="map" key={map.id}>
                            <p>{map.name}</p>
                        </article>
                    )
                    )}
                </section>
                <section id="createMapModal" className="form" style={this.state.shouldShowCreate ? showStyle : hideStyle}>
                    <article>
                        <div>
                            <label>Audio File</label>
                            <input type="file" id="audio" accept=".mp3,.wav,.ogg|audio/*" onChange={this.onSongAudioChange} />
                        </div>
                        <div>
                            <label>Cover Image</label>
                            <input type="file" accept=".jpg,.png,.jpeg|image/*" onChange={this.onSongImageChange} />
                        </div>
                        <input type="text" className="text-input" placeholder="Version" onChange={this.onVersionChange} value={this.state.version} />
                        <input type="text" className="text-input" placeholder="Name" onChange={this.onNameChange} value={this.state.name} />
                        <input type="text" className="text-input" placeholder="Subname" onChange={this.onSubNameChange} value={this.state.subName} />
                        <input type="text" className="text-input" placeholder="Artist" onChange={this.onArtistChange} value={this.state.artist} />
                        <input type="text" className="text-input" placeholder="Environment Name" onChange={this.onEnvironmentNameChange} value={this.state.environmentName} />
                        <input type="number" className="text-input" placeholder="BPM" onChange={this.onBpmChange} value={this.state.bpm} />
                        <input type="number" className="text-input" placeholder="Shuffle" onChange={this.onShuffleChange} value={this.state.shuffle} />
                        <input type="number" className="text-input" placeholder="Shuffle Period" onChange={this.onShufflePeriodChange} value={this.state.shufflePeriod} />
                        <input type="number" className="text-input" placeholder="Preview Start" onChange={this.onPreviewStartChange} value={this.state.previewStart} />
                        <input type="number" className="text-input" placeholder="Preview Duration" onChange={this.onPreviewDurationChange} value={this.state.previewDuration} />
                        <input type="number" className="text-input" placeholder="Song Time Offset" onChange={this.onSongTimeOffsetChange} value={this.state.songTimeOffset} />
                        <div>
                            <button onClick={() => this.showCreate(false)}>Cancel</button>
                            <button onClick={() => { this.onCreateMap(); this.showCreate(false) }}>Make Map</button>
                        </div>
                    </article>
                </section>
            </>
        )
    }
}