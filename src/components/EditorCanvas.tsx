import React, { Component } from 'react'
import { Scene, WebGLRenderer, PerspectiveCamera, AmbientLight, Raycaster, Vector2, Camera, Group, Vector3 } from 'three'
import GLTFLoader from 'three-gltf-loader'

interface IProps { }

interface IState {
    beat: number
    scene: Scene
    camera: Camera
    placementGrid: Group
}

export class EditorCanvas extends Component<IProps, IState> {

    state: IState = {
        beat: 0,
        scene: new Scene(),
        camera: new Camera(),
        placementGrid: new Group()
    }

    componentDidMount() {
        const scene = new Scene();
        this.setState({ scene: scene })
        var renderer = new WebGLRenderer();
        let canvasArea = document.getElementById("canvas-area")
        if (canvasArea) {
            renderer.setSize(canvasArea.offsetWidth, canvasArea.offsetHeight);
            let canvas = renderer.domElement
            canvasArea.appendChild(canvas)

            const camera = new PerspectiveCamera(75, canvasArea.offsetWidth, canvasArea.offsetHeight, 0.1);
            this.setState({ camera: camera })
            camera.position.set(0, 6, 15);

            const loader = new GLTFLoader();
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 7, "isPlaced": false }
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 4, "isPlaced": false }
                    root.position.y = 3
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 1, "isPlaced": false }
                    root.position.y = 6
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 6, "isPlaced": false }
                    root.position.z = 3
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 3, "isPlaced": false }
                    root.position.z = 3
                    root.position.y = 3
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 0, "isPlaced": false }
                    root.position.z = 3
                    root.position.y = 6
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 8, "isPlaced": false }
                    root.position.z = -3
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 5, "isPlaced": false }
                    root.position.z = -3
                    root.position.y = 3
                    this.state.placementGrid.add(root);
                });
            loader.load("./models/GridPane.glb",
                gltf => {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 2, "isPlaced": false }
                    root.position.z = -3
                    root.position.y = 6
                    this.state.placementGrid.add(root);
                });
            this.state.placementGrid.renderOrder = 0
            scene.add(this.state.placementGrid)
            let quat = this.state.placementGrid.quaternion
            this.state.placementGrid.rotateY(45 * Math.PI / 180)
            this.state.placementGrid.quaternion.set(quat.x, quat.y, quat.z, quat.w)

            const ambientLight = new AmbientLight(0x20202A, 20);
            scene.add(ambientLight);

            const raycaster = new Raycaster();
            canvasArea.addEventListener('click', evt => this.placeBlock(evt, canvas, camera, raycaster, scene, loader), false);
            canvasArea.addEventListener('contextmenu', evt => this.removeBlock(evt, canvas, camera, raycaster, scene), false);

            this.animate(camera, renderer, scene, canvasArea, raycaster);
        }
    }
    placeBlock = (event: MouseEvent, canvas: HTMLCanvasElement, camera: Camera, raycaster: Raycaster, scene: Scene, loader: GLTFLoader) => {
        let tempMouse = new Vector2()
        let rect = canvas.getBoundingClientRect();
        tempMouse.x = (event.clientX / (window.innerWidth + rect.left + .2)) * 2 - 1;
        tempMouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(tempMouse, camera);
        // let meshes = scene.children.filter(val => val.type === "Scene").map(val => val.children.filter(val => val.type === "Mesh")).map(val => val[0])
        var intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let gridCellData = intersects[0].object.userData
            console.log(gridCellData)
            if (!gridCellData.isPlaced) {
                gridCellData.isPlaced = true;
                loader.load("./models/LBlock.glb",
                    gltf => {
                        const root = gltf.scene;
                        root.renderOrder = 1
                        // root.translateX(1)
                        root.scale.set(.75, .75, .75)
                        root.userData = { "beat": this.state.beat, "position": gridCellData.position }
                        if (intersects[0].object.parent && intersects[0].object.parent.parent) {

                            root.setRotationFromEuler(this.state.placementGrid.rotation)
                            root.applyQuaternion(this.state.placementGrid.quaternion)
                            let vector = new Vector3()
                            intersects[0].object.parent.getWorldPosition(vector)
                            root.position.set(vector.x, vector.y, vector.z)
                            root.quaternion.set(this.state.placementGrid.quaternion.x, this.state.placementGrid.quaternion.y, this.state.placementGrid.quaternion.z, this.state.placementGrid.quaternion.w)
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
        // let meshes = scene.children.filter(val => val.type === "Scene").map(val => val.children.filter(val => val.type === "Mesh")).map(val => val[0])
        var intersects = raycaster.intersectObjects(scene.children, true);
        let gridCellIntersects = intersects.filter(intersect => intersect.object.userData.isPlaced)
        if (gridCellIntersects.length > 0) {
            let gridCellData = gridCellIntersects[0].object.userData
            if (gridCellData.isPlaced) {
                let noteToRemove = scene.children.filter(child => child.userData.position === gridCellData.position && child.userData.beat === this.state.beat)[0]
                scene.remove(noteToRemove)
                gridCellData.isPlaced = false;
            }
        }
    }
    animate(camera: PerspectiveCamera, renderer: WebGLRenderer, scene: Scene, canvasArea: HTMLElement, raycaster: Raycaster) {
        camera.aspect = canvasArea.offsetWidth / canvasArea.offsetHeight;
        camera.updateProjectionMatrix();
        requestAnimationFrame(() => this.animate(camera, renderer, scene, canvasArea, raycaster));
        renderer.render(scene, camera);
    }
    moveBeat(evt: React.WheelEvent<HTMLDivElement>) {
        if (evt.deltaY < 0) {
            this.setState({ beat: this.state.beat + 1 })
        } else {
            if (this.state.beat > 0) {
                this.setState({ beat: this.state.beat - 1 })
            }
        }
        let notes = this.state.scene.children.filter(child => child.userData.beat !== undefined)
        let grid = this.state.placementGrid
        grid.children.forEach(child => child.children[0].userData = { ...child.children[0].userData, isPlaced: false })
        notes.forEach(note => note.translateX(evt.deltaY < 0 ? 5 : -5))
        notes.forEach(note => {
            let cell = this.state.placementGrid.children.filter(child => child.children[0].userData.position === note.userData.position)[0]
            let cellPos = new Vector3()
            cell.getWorldPosition(cellPos)
            note.position.z - cellPos.z > 3 ? note.visible = false : note.visible = true
        })
    }

    render() {
        return (
            <div id="canvas-area" onWheel={(evt) => this.moveBeat(evt)}></div>
        )
    }
}