var webActionController = WebActionController();
var scene = null;
var camera = null;

var drone_model = null;
var color = "#FFFFFF";

var source_url = "";

$(function () {
    source_url = static_url + "main_view/";

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    scene.background = new THREE.Color(0x000000);
    camera.position.z = 10;
    var tick = 0,
        clock = new THREE.Clock(true),
        options,
        spawnerOptions,
        particleSystem;

    particleSystem = new THREE.GPUParticleSystem({
        maxParticles: 250000
    });

    scene.add(particleSystem);
    options = {
        position: new THREE.Vector3(),
        positionRandomness: 3,
        velocity: new THREE.Vector3(),
        velocityRandomness: 5,
        color: 0xaa88ff,
        colorRandomness: 10,
        turbulence: 10,
        lifetime: 10,
        size: 20,
        sizeRandomness: 100
    };

    spawnerOptions = {
        spawnRate: 1000,
        horizontalSpeed:1,
        verticalSpeed: 1,
        timeScale: 0.1
    }
    var renderer = new THREE.WebGLRenderer();
    var container = document.getElementById('canvas');
    var positionInfo = container.getBoundingClientRect();

    renderer.setSize(positionInfo.width - 2, positionInfo.height - 2);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    var data = [
        {
            x: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            y: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            type: 'scatter',
            marker: {
                color: '#009933',
                line: {
                    width: 2.5
                }
            }
        }
    ];

    var layout = {
        paper_bgcolor: '#00000000',
        plot_bgcolor: '#00000000',
        xaxis: {
            showgrid: true,
            mirror: 'ticks',
            tickfont: {
                color: 'snow'
            },
            gridcolor: 'snow',
            zerolinecolor: 'snow',
            gridwidth: 1,
            title: {
                text: 'X',
                font: {
                    color: 'snow',
                    size: 16
                }
            }
        },
        yaxis: {
            showgrid: true,
            mirror: 'ticks',
            tickfont: {
                color: 'snow'
            },
            gridcolor: 'snow',
            zerolinecolor: 'snow',
            gridwidth: 2,
            title: {
                text: 'Y',
                font: {
                    color: 'snow',
                    size: 16
                }
            }
        },
        title: {
            text: 'Some title',
            font: {
                color: '#ffffff',
                size: 16
            }
        },
        margin: {
            l: 50,
            r: 25,
            b: 50,
            t: 50
        }

    };
    Plotly.newPlot('tester1', data, layout, { displayModeBar: false });
    Plotly.newPlot('tester', data, layout, { displayModeBar: false });
    var cube2 = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1, 10),
        new THREE.MeshLambertMaterial({ color: 0x0d0d0d })
    );

    cube2.castShadow = true;//obvezno za vsak objekt!
    cube2.receiveShadow = true;//obvezno za vsak objekt!

    cube2.position.y = -3;
    scene.add(cube2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    {//luč, najbolje directional light (sonce), najmanj težav
        var light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.castShadow = true;
        light.position.set(0, 10, 0);
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 1000;

        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;

        scene.add(light);
    }
    var effect = new THREE.AnaglyphEffect(renderer);
    effect.setSize(container.offsetWidth, container.offsetHeight);

    var update = function () {
        drone_model.rotation.x += 0.01;
        drone_model.rotation.y += 0.01;
    };

    //draw scene
    var render = function () {
        effect.render(scene, camera);
    };

    //run game loop (update, render, repeat)
    var GameLoop = function () {
        requestAnimationFrame(GameLoop);
        var delta = clock.getDelta() * spawnerOptions.timeScale;
        tick += delta;

        if (tick < 0) tick = 0;

        if (delta > 0) {
            options.position.x = Math.sin(tick * spawnerOptions.horizontalSpeed) * 10;
            options.position.y = Math.sin(tick * spawnerOptions.verticalSpeed) * 10;
            options.position.z = Math.sin(tick * spawnerOptions.horizontalSpeed + spawnerOptions.verticalSpeed) * 2;

            for (var x = 0; x < spawnerOptions.spawnRate * delta; x++) {
                particleSystem.spawnParticle(options);
            }
        }

        particleSystem.update(tick);
        update();
        render();
    };

    setupSelects();
    GameLoop();
});


function loadModel(obj) {
    if (drone_model)
        scene.remove(drone_model);

    var objLoader = new THREE.OBJLoader();
    drone_model = objLoader.parse(obj);
    drone_model.name = "drone";
    drone_model.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
        }
    });
    scene.add(drone_model);
    drone_model.position.z = 0;
    drone_model.position.x = 0;
    drone_model.position.y = 0;
    loadTexture(color)
}
function loadTexture(newColor) {
    color = newColor
    var selectedObject = scene.getObjectByName("drone");
    if (selectedObject)
        selectedObject.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshPhongMaterial({ color: color });
            }
        });
}


function setupSelects() {
    // To style only selects with the selectpicker class
    $('.selectpicker').selectpicker();
    // Add event to select element
    $('#object_select').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
        webActionController.getModel(e.target[clickedIndex].value).done(function (response) {
            if (response.status == 0) {
                loadModel(response.data)
            }
        });
    });
    // Select first element by default
    var options = document.getElementById("object_select").options;
    if (options.length > 0) {
        webActionController.getModel(options[0].value).done(function (response) {
            if (response.status == 0) {
                loadModel(response.data)
            }
        });
    }

    $("#texture_select").on("change", function (event) {
        loadTexture(event.target.value);
    });

}