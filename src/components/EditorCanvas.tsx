import React, { Component, CSSProperties } from 'react'
import { Scene, WebGLRenderer, PerspectiveCamera, AmbientLight, Raycaster, Vector2, Camera, Group, Vector3, Mesh, EdgesGeometry, LineSegments, LineBasicMaterial } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Toast } from './notification/Toast'
import "../styling/notification/Toast.css"

interface IProps {
    bpm: number
    songFileURL: string
    beatmapFileLoaction?: string
    canSave: boolean
    apiURL: string
    beatmapid?: string
}

interface IState {
    beat: number
    scene: Scene
    camera: Camera
    placementGrid: Group
    selectedObject: string
    selectedObjectID: number
    cutDirection: number
    arrowKeys: Array<boolean>
    _notes: Array<{
        "_time": number
        "_lineIndex": number
        "_lineLayer": number
        "_type": number
        "_cutDirection": number
    }>
    _obstacles: Array<{
        "_time": number
        "_lineIndex": number
        "_lineLayer": number
        "_type": number
        "_duration": number
        "_width": number
    }>
    showToast: boolean
    toastType: "success" | "danger" | ""
    toastMsg: "Successfully Saved Beatmap" | "Beatmap Save Failed" | "",
    amountBeatToMove: number
    allowMapToMove: boolean
    timeToRestore: number
    shouldUpdateTime: boolean
    shouldShowControls: boolean
}
export class EditorCanvas extends Component<IProps, IState> {

    state: IState = {
        arrowKeys: [false, false, false, false],
        cutDirection: 1,
        beat: 0,
        scene: new Scene(),
        camera: new Camera(),
        placementGrid: new Group(),
        selectedObjectID: 0,
        selectedObject: "LBlock",
        "_notes": [],
        "_obstacles": [],
        showToast: false,
        toastType: "",
        toastMsg: "",
        amountBeatToMove: 1,
        allowMapToMove: true,
        timeToRestore: 0,
        shouldUpdateTime: true,
        shouldShowControls: true
    }

    componentDidMount() {
        const loader = new GLTFLoader();
        if (this.props.beatmapid) {
            fetch(`${this.props.apiURL}/getbeatmapdata?beatmapid=${this.props.beatmapid}`)
                .then(res => res.json())
                .then(data => {
                    let parseData = JSON.parse(data.beatmapdata);
                    parseData._obstacles.forEach((wall: any) => {
                        let filteredGridCell = this.state.placementGrid.children.filter(group => (group.children[0].userData.lineIndex === wall._lineIndex) && (group.children[0].userData.lineLayer === wall._lineLayer))[0];
                        loader.load(`./models/Wall.glb`,
                            gltf => {
                                const root = gltf.scene;
                                root.renderOrder = 1
                                root.scale.set(.75, .75, .75);
                                (root.children[0] as Mesh).geometry.rotateZ(180 * Math.PI / 180);
                                (root.children[0] as Mesh).geometry.rotateX(180 * Math.PI / 180);
                                root.setRotationFromEuler(this.state.placementGrid.rotation)
                                root.applyQuaternion(this.state.placementGrid.quaternion)
                                let vector = new Vector3()
                                filteredGridCell.getWorldPosition(vector)
                                root.position.set(vector.x, vector.y, vector.z)
                                root.userData = { "beat": wall._time, "lineIndex": filteredGridCell.children[0].userData.lineIndex, "lineLayer": filteredGridCell.children[0].userData.lineLayer, "baseVec": vector, isWall: false }
                                root.quaternion.set(this.state.placementGrid.quaternion.x, this.state.placementGrid.quaternion.y, this.state.placementGrid.quaternion.z, this.state.placementGrid.quaternion.w)
                                const edges = new EdgesGeometry((root.children[0] as Mesh).geometry);
                                const line = new LineSegments(edges, new LineBasicMaterial({ color: 0xffffff }));
                                root.add(line);
                                scene.add(root)
                            });
                    })
                    parseData._notes.forEach((note: any) => {
                        let filteredGridCell = this.state.placementGrid.children.filter(group => (group.children[0].userData.lineIndex === note._lineIndex) && (group.children[0].userData.lineLayer === note._lineLayer))[0];
                        let noteType = "";
                        if (note._type === 0) {
                            noteType = "LBlock"
                        }
                        if (note._type === 1) {
                            noteType = "RBlock"
                        }
                        if (note._type === 3) {
                            noteType = "Mine"
                        }
                        loader.load(`./models/${noteType}.glb`,
                            gltf => {
                                const root = gltf.scene;
                                root.renderOrder = 1
                                root.scale.set(.75, .75, .75);
                                (root.children[0] as Mesh).geometry.rotateZ(180 * Math.PI / 180);
                                (root.children[0] as Mesh).geometry.rotateX(180 * Math.PI / 180);
                                root.setRotationFromEuler(this.state.placementGrid.rotation)
                                root.applyQuaternion(this.state.placementGrid.quaternion)
                                let vector = new Vector3()
                                filteredGridCell.getWorldPosition(vector)
                                root.position.set(vector.x, vector.y, vector.z)
                                let rotation = 0;
                                switch (note._cutDirection) {
                                    case 0:
                                        rotation = 180 * (Math.PI / 180)
                                        break;
                                    case 1:
                                        rotation = 0;
                                        break;
                                    case 2:
                                        rotation = -90 * (Math.PI / 180)
                                        break;
                                    case 3:
                                        rotation = 90 * (Math.PI / 180)
                                        break;
                                    case 4:
                                        rotation = 135 * (Math.PI / 180)
                                        break;
                                    case 5:
                                        rotation = -135 * (Math.PI / 180)
                                        break;
                                    case 6:
                                        rotation = 45 * (Math.PI / 180)
                                        break;
                                    case 7:
                                        rotation = -45 * (Math.PI / 180)
                                        break;
                                }
                                root.userData = { "beat": note._time, "lineIndex": filteredGridCell.children[0].userData.lineIndex, "lineLayer": filteredGridCell.children[0].userData.lineLayer, "baseVec": vector, isWall: false }
                                root.quaternion.set(this.state.placementGrid.quaternion.x, this.state.placementGrid.quaternion.y, this.state.placementGrid.quaternion.z, this.state.placementGrid.quaternion.w)
                                root.rotateX(rotation)
                                const edges = new EdgesGeometry((root.children[0] as Mesh).geometry);
                                const line = new LineSegments(edges, new LineBasicMaterial({ color: 0xffffff }));
                                root.add(line);
                                scene.add(root)
                            });
                    })
                    this.setState({ _notes: parseData._notes, _obstacles: parseData._obstacles })
                })
        }


        const scene = new Scene();
        this.setState({ scene: scene })
        var renderer = new WebGLRenderer();
        renderer.autoClearDepth = true;
        let canvasArea = document.getElementById("canvas-area")
        if (canvasArea) {
            renderer.setSize(canvasArea.offsetWidth, canvasArea.offsetHeight);
            let canvas = renderer.domElement
            canvasArea.appendChild(canvas)

            const camera = new PerspectiveCamera(75, canvasArea.offsetWidth, canvasArea.offsetHeight, 0.1);
            this.setState({ camera: camera })
            camera.position.set(0, 6, 20);

            const controls = new OrbitControls(camera, renderer.domElement)
            controls.enableKeys = false
            controls.enableDamping = true
            controls.dampingFactor = 0.25
            controls.enableZoom = false;
            controls.enablePan = false;

            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 0, "lineLayer": 0, "isPlaced": false }
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 1, "lineLayer": 0, "isPlaced": false }
                    root.position.z = 3

                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 2, "lineLayer": 0, "isPlaced": false }
                    root.position.z = 6

                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 3, "lineLayer": 0, "isPlaced": false }
                    root.position.z = 9

                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 0, "lineLayer": 1, "isPlaced": false }
                    root.position.y = 3
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 1, "lineLayer": 1, "isPlaced": false }
                    root.position.y = 3
                    root.position.z = 3

                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 2, "lineLayer": 1, "isPlaced": false }
                    root.position.y = 3
                    root.position.z = 6

                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 3, "lineLayer": 1, "isPlaced": false }
                    root.position.y = 3
                    root.position.z = 9

                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 0, "lineLayer": 2, "isPlaced": false }
                    root.position.y = 6
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 1, "lineLayer": 2, "isPlaced": false }
                    root.position.y = 6
                    root.position.z = 3

                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 2, "lineLayer": 2, "isPlaced": false }
                    root.position.y = 6
                    root.position.z = 6

                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "lineIndex": 3, "lineLayer": 2, "isPlaced": false }
                    root.position.y = 6
                    root.position.z = 9

                    this.state.placementGrid.add(root);
                });
            scene.add(this.state.placementGrid)
            let quat = this.state.placementGrid.quaternion
            this.state.placementGrid.rotateY(45 * Math.PI / 180)
            this.state.placementGrid.quaternion.set(quat.x, quat.y, quat.z, quat.w)

            const ambientLight = new AmbientLight(0x20202A, 20);
            scene.add(ambientLight);

            const raycaster = new Raycaster();
            canvasArea.addEventListener('click', evt => this.placeBlock(evt, canvas, camera, raycaster, scene, loader), false);
            canvasArea.addEventListener('contextmenu', evt => this.removeBlock(evt, canvas, camera, raycaster, scene), false);
            window.addEventListener('keydown', evt => this.changeSelectedObject(evt))
            window.addEventListener('keyup', evt => this.checkArrows(evt))
            let aud = document.getElementById("editor-audio")
            if (aud) {
                aud.addEventListener("timeupdate", evt => {
                    if (this.state.allowMapToMove) {
                        if (!(evt.target as HTMLMediaElement).paused) {
                            let time = Math.round(10 * (evt.target as HTMLMediaElement).currentTime) / 10
                            this.setState({ beat: (time / 60) * this.props.bpm })
                        }
                    } else {
                        if (this.state.shouldUpdateTime) {
                            this.setState({ shouldUpdateTime: false, timeToRestore: (evt.target as HTMLMediaElement).currentTime })
                            if (evt.target) {
                                evt.target.addEventListener("pause", this.onPause)
                            }
                        }
                    }
                })
            }
            this.animate(camera, renderer, scene, canvasArea, raycaster);
        }
    }
    onPause = (evt: any) => {
        this.setState({ shouldUpdateTime: true });
        (evt.target as HTMLMediaElement).currentTime = this.state.timeToRestore
        evt.target.removeEventListener("pause", this.onPause)
    }
    placeBlock = (event: MouseEvent, canvas: HTMLCanvasElement, camera: Camera, raycaster: Raycaster, scene: Scene, loader: GLTFLoader) => {
        let tempMouse = new Vector2()
        let rect = canvas.getBoundingClientRect();
        tempMouse.x = (event.clientX / (window.innerWidth + rect.left)) * 2 - 1;
        tempMouse.y = - (event.clientY / window.innerHeight + rect.top) * 2 + 1;
        raycaster.setFromCamera(tempMouse, camera);
        var intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let gridCellData = intersects[0].object.userData
            if (!gridCellData.isPlaced && gridCellData.isPlaced !== undefined) {
                gridCellData.isPlaced = true;
                loader.load(`./models/${this.state.selectedObject}.glb`,
                    gltf => {
                        const root = gltf.scene;
                        root.renderOrder = 1
                        root.scale.set(.75, .75, .75);
                        (root.children[0] as Mesh).geometry.rotateZ(180 * Math.PI / 180);
                        (root.children[0] as Mesh).geometry.rotateX(180 * Math.PI / 180);
                        if (intersects[0].object.parent && intersects[0].object.parent.parent) {
                            root.setRotationFromEuler(this.state.placementGrid.rotation)
                            root.applyQuaternion(this.state.placementGrid.quaternion)
                            let vector = new Vector3()
                            intersects[0].object.parent.getWorldPosition(vector)
                            root.position.set(vector.x, vector.y, vector.z)
                            let rotation = 0;
                            switch (this.state.cutDirection) {
                                case 0:
                                    rotation = 180 * (Math.PI / 180)
                                    break;
                                case 1:
                                    rotation = 0;
                                    break;
                                case 2:
                                    rotation = -90 * (Math.PI / 180)
                                    break;
                                case 3:
                                    rotation = 90 * (Math.PI / 180)
                                    break;
                                case 4:
                                    rotation = 135 * (Math.PI / 180)
                                    break;
                                case 5:
                                    rotation = -135 * (Math.PI / 180)
                                    break;
                                case 6:
                                    rotation = 45 * (Math.PI / 180)
                                    break;
                                case 7:
                                    rotation = -45 * (Math.PI / 180)
                                    break;
                            }
                            root.userData = { "beat": this.state.beat, "lineIndex": gridCellData.lineIndex, "lineLayer": gridCellData.lineLayer, "baseVec": vector, isWall: false }
                            root.quaternion.set(this.state.placementGrid.quaternion.x, this.state.placementGrid.quaternion.y, this.state.placementGrid.quaternion.z, this.state.placementGrid.quaternion.w)
                            root.rotateX(rotation)
                            const edges = new EdgesGeometry((root.children[0] as Mesh).geometry);
                            const line = new LineSegments(edges, new LineBasicMaterial({ color: 0xffffff }));
                            line.userData = { "beat": this.state.beat, "lineIndex": gridCellData.lineIndex, "lineLayer": gridCellData.lineLayer, "baseVec": vector, isWall: false }
                            root.add(line);
                            if (this.state.selectedObject !== "Wall") {
                                let notes = [...this.state._notes];
                                notes.push({
                                    "_lineIndex": gridCellData.lineIndex,
                                    "_lineLayer": gridCellData.lineLayer,
                                    "_time": this.state.beat,
                                    "_type": this.state.selectedObjectID,
                                    "_cutDirection": this.state.cutDirection,
                                })
                                this.setState({ _notes: notes })
                            } else {
                                let obstacles = [...this.state._obstacles]
                                obstacles.push({
                                    "_lineIndex": gridCellData.lineIndex,
                                    "_lineLayer": gridCellData.lineLayer,
                                    "_time": this.state.beat,
                                    "_type": 1,
                                    "_duration": 1,
                                    "_width": 1
                                });
                                root.userData.isWall = true;
                                this.setState({ _obstacles: obstacles })
                            }
                        }
                        scene.add(root)
                    });
            }
        }
    }
    removeBlock = (event: MouseEvent, canvas: HTMLCanvasElement, camera: Camera, raycaster: Raycaster, scene: Scene) => {
        event.preventDefault()
        let tempMouse = new Vector2()
        let rect = canvas.getBoundingClientRect();
        tempMouse.x = (event.clientX / (window.innerWidth + rect.left)) * 2 - 1;
        tempMouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(tempMouse, camera);
        var intersects = raycaster.intersectObjects(scene.children, true);
        let potentialNotes = intersects.filter(intersect => intersect.object.parent)
        let noteGroups = potentialNotes.map(intersect => intersect.object.parent).filter(group => group ? group.userData.beat !== undefined : false)
        if (noteGroups.length > 0 && noteGroups[0]) {
            let noteToRemove = noteGroups[0]
            scene.remove(noteToRemove)
            if (!noteToRemove.userData.isWall) {
                let notes = [...this.state._notes];
                notes.forEach(note => {
                    if (note._lineIndex === noteToRemove.userData.lineIndex && note._lineLayer === noteToRemove.userData.lineLayer && note._time === noteToRemove.userData.beat) {
                        notes.splice(notes.indexOf(note), 1)
                    }
                })
                this.setState({ _notes: notes })
            } else {
                let obstacles = [...this.state._obstacles];
                obstacles.forEach(note => {
                    if (note._lineIndex === noteToRemove.userData.lineIndex && note._lineLayer === noteToRemove.userData.lineLayer && note._time === noteToRemove.userData.beat) {
                        obstacles.splice(obstacles.indexOf(note), 1)
                    }
                })
                this.setState({ _obstacles: obstacles })
            }
        }
    }

    animate(camera: PerspectiveCamera, renderer: WebGLRenderer, scene: Scene, canvasArea: HTMLElement, raycaster: Raycaster) {
        camera.aspect = canvasArea.offsetWidth / canvasArea.offsetHeight;
        camera.updateProjectionMatrix();
        requestAnimationFrame(() => this.animate(camera, renderer, scene, canvasArea, raycaster));
        let notes = this.state.scene.children.filter(child => child.userData.beat !== undefined);
        notes.forEach(note => {
            let baseVec = note.userData.baseVec
            note.position.set(baseVec.x, baseVec.y, baseVec.z)
            note.translateX((note.userData.beat - this.state.beat) * 5)
        });
        renderer.clearDepth();
        renderer.render(scene, camera);
    }
    moveBeat(evt: React.WheelEvent<HTMLDivElement>) {
        if (evt.deltaY < 0) {
            this.setState({ beat: this.state.beat + this.state.amountBeatToMove })
            let grid = this.state.placementGrid;
            grid.children.forEach(child => child.children[0].userData = { ...child.children[0].userData, isPlaced: false });
            (document.getElementById("editor-audio") as HTMLAudioElement).currentTime = parseFloat(`${(this.state.beat / this.props.bpm) * 60}`)
        } else {
            if (this.state.beat > 0) {
                this.setState({ beat: this.state.beat - this.state.amountBeatToMove })
                let grid = this.state.placementGrid;
                grid.children.forEach(child => child.children[0].userData = { ...child.children[0].userData, isPlaced: false });
            } else {
                this.setState({ beat: 0 })
            }
            (document.getElementById("editor-audio") as HTMLAudioElement).currentTime = parseFloat(`${(this.state.beat / this.props.bpm) * 60}`);
        }
    }
    checkArrows(evt: KeyboardEvent) {
        // TODO implement arrow check

        let arrows = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"];
        if (arrows.includes(evt.key)) {
            let tempArray = [...this.state.arrowKeys];
            tempArray[arrows.indexOf(evt.key)] = false;
            this.setState({ arrowKeys: tempArray })
        }
    }

    decideOrientation() {

        if (this.state.arrowKeys[0] && this.state.arrowKeys[1]) {
            this.setState({ cutDirection: 4 })
            return;
        } else if (this.state.arrowKeys[1] && this.state.arrowKeys[2]) {
            this.setState({ cutDirection: 5 })
            return;
        } else if (this.state.arrowKeys[2] && this.state.arrowKeys[3]) {
            this.setState({ cutDirection: 7 })
            return;
        } else if (this.state.arrowKeys[3] && this.state.arrowKeys[0]) {
            this.setState({ cutDirection: 6 })
            return;
        } else if (this.state.arrowKeys[0]) {
            this.setState({ cutDirection: 2 })
            return;
        } else if (this.state.arrowKeys[1]) {
            this.setState({ cutDirection: 0 })
            return;
        } else if (this.state.arrowKeys[2]) {
            this.setState({ cutDirection: 3 })
            return;
        } else if (this.state.arrowKeys[3]) {
            this.setState({ cutDirection: 1 })
            return;
        }
    }

    changeSelectedObject(evt: KeyboardEvent) {
        let arrows = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"];
        if (arrows.includes(evt.key)) {
            let tempArray = [...this.state.arrowKeys];
            tempArray[arrows.indexOf(evt.key)] = true;
            this.setState({ arrowKeys: tempArray }, () => this.decideOrientation())
        }
        switch (evt.key) {
            case "1":
                this.setState({ selectedObject: "LBlock", selectedObjectID: 0 })
                break;
            case "2":
                this.setState({ selectedObject: "RBlock", selectedObjectID: 1 })
                break;
            case "3":
                this.setState({ selectedObject: "Wall", selectedObjectID: 2 })
                break;
            case "4":
                this.setState({ selectedObject: "Mine", selectedObjectID: 3 })
                break;
        }
        if ((evt.key === "s" || evt.key === "S") && this.props.canSave && this.props.beatmapid) {
            fetch(`${this.props.apiURL}/savebeatmap`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "beatmapid": this.props.beatmapid,
                    "beatmapinfo": JSON.stringify({ _notes: [...this.state._notes], _obstacles: [...this.state._obstacles] })
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code === 200) {
                        this.setState({ showToast: true, toastMsg: "Successfully Saved Beatmap", toastType: "success" })
                    } else {
                        this.setState({ showToast: true, toastMsg: "Beatmap Save Failed", toastType: "danger" })
                    }
                })
                .catch((err) => {
                    this.setState({ showToast: true, toastMsg: "Beatmap Save Failed", toastType: "danger" })
                    console.error(err)
                })
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
                <Toast isVisible={this.state.showToast} toastText={this.state.toastMsg} hide={() => this.setState({ showToast: false })} type={this.state.toastType} />
                <div id="canvas-area" onWheel={(evt) => this.moveBeat(evt)}>
                    <button onClick={() => this.setState({ shouldShowControls: true })} id="showControlsBtn" style={!this.state.shouldShowControls ? showStyle : hideStyle}>Show Controls</button>
                    <div id="editorControls" style={this.state.shouldShowControls ? showStyle : hideStyle}>
                        <h3>Editor Controls:</h3>
                        <div>
                            <label>Beat Increment:</label>
                            <input type="number" step="0.1" id="beatAmt" className="text-input" value={this.state.amountBeatToMove} onChange={(evt) => this.setState({ amountBeatToMove: parseFloat(evt.target.value) })} />
                            <label>Beat(s)</label>
                        </div>
                        <div>
                            <label>Move beatmap with song?</label>
                            <input type="checkbox" checked={this.state.allowMapToMove} onChange={evt => this.setState({ allowMapToMove: evt.target.checked })} />
                        </div>
                        <button onClick={() => this.setState({ shouldShowControls: false })}>Hide Controls</button>
                    </div>
                </div>
                <audio id="editor-audio" src={this.props.songFileURL} controls />
            </>
        )
    }
}