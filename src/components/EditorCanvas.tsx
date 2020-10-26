import { eventNames } from 'process';
import React, { Component } from 'react'
import { Scene, WebGLRenderer, PerspectiveCamera, AmbientLight, Raycaster, Vector2, Camera } from 'three'
import GLTFLoader from 'three-gltf-loader'

interface IProps { }

interface IState {
}

export class EditorCanvas extends Component<IProps, IState> {

    componentDidMount() {
        const scene = new Scene();
        var renderer = new WebGLRenderer();
        let canvasArea = document.getElementById("canvas-area")
        if (canvasArea) {
            renderer.setSize(canvasArea.offsetWidth, canvasArea.offsetHeight);
            let canvas = renderer.domElement
            canvasArea.appendChild(canvas)

            const camera = new PerspectiveCamera(75, canvasArea.offsetWidth, canvasArea.offsetHeight, 0.1);
            camera.position.set(12, 3, 5);
            camera.rotation.set(0, 1, 0)

            const loader = new GLTFLoader();
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 7, "isPlaced": false }
                    scene.add(root);
                });
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 4, "isPlaced": false }
                    root.position.y = 3
                    scene.add(root);
                });
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 1, "isPlaced": false }
                    root.position.y = 6
                    scene.add(root);
                });
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 6, "isPlaced": false }
                    root.position.z = 3
                    scene.add(root);
                });
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 3, "isPlaced": false }
                    root.position.z = 3
                    root.position.y = 3
                    scene.add(root);
                });
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 0, "isPlaced": false }
                    root.position.z = 3
                    root.position.y = 6
                    scene.add(root);
                });
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 8, "isPlaced": false }
                    root.position.z = -3
                    scene.add(root);
                });
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 5, "isPlaced": false }
                    root.position.z = -3
                    root.position.y = 3
                    scene.add(root);
                });
            loader.load("./models/GridPane.glb",
                function (gltf) {
                    const root = gltf.scene;
                    root.children[0].userData = { "position": 2, "isPlaced": false }
                    root.position.z = -3
                    root.position.y = 6
                    scene.add(root);
                });

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
        tempMouse.x = (event.clientX / (window.innerWidth + rect.left)) * 2 - 1;
        tempMouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(tempMouse, camera);
        let meshes = scene.children.filter(val => val.type === "Scene").map(val => val.children.filter(val => val.type === "Mesh")).map(val => val[0])
        var intersects = raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
            let gridCellData = intersects[0].object.userData
            if (!gridCellData.isPlaced) {
                gridCellData.isPlaced = true;
                loader.load("./models/LBlock.glb",
                    function (gltf) {
                        const root = gltf.scene;
                        root.translateX(1)
                        intersects[0].object.add(root)
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
        let meshes = scene.children.filter(val => val.type === "Scene").map(val => val.children.filter(val => val.type === "Mesh")).map(val => val[0])
        var intersects = raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
            let gridCellData = intersects[0].object.userData
            if (gridCellData.isPlaced) {
                intersects[0].object.remove(intersects[0].object.children[0])
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

    render() {
        return (
            <div id="canvas-area"></div>
        )
    }
}