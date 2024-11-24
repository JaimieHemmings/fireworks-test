import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { Sky } from 'three/addons/objects/Sky.js'
import fireworkVertexShader from './shaders/firework/vertex.glsl'
import fireworkFragmentShader from './shaders/firework/fragment.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

sizes.resolution = new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)
    sizes.resolution.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.set(1.5, 0, 6)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

/**
 * Fireworks
 */

const textures = [
    textureLoader.load('/particles/1.png'),
    textureLoader.load('/particles/2.png'),
    textureLoader.load('/particles/3.png'),
    textureLoader.load('/particles/4.png'),
    textureLoader.load('/particles/5.png'),
    textureLoader.load('/particles/6.png'),
    textureLoader.load('/particles/7.png'),
    textureLoader.load('/particles/8.png'),
    textureLoader.load('/particles/9.png'),
    textureLoader.load('/particles/10.png'),
]

const createFirework = (count, position, size, texture, radius, color) =>
{
    // Geometry
    const positionsArray = new Float32Array(count * 3)
    const sizesArray = new Float32Array(count)
    const timeMultipliersArray = new Float32Array(count)

    for(let i=0; i < count; i++)
    {
        const i3 = i * 3

        const spherical = new THREE.Spherical(
            radius * (0.75 + Math.random() * 0.25),
            Math.random() * Math.PI,
            Math.random() * Math.PI * 2
        )
        const position = new THREE.Vector3()
        position.setFromSpherical(spherical)

        positionsArray[i3 + 0] = position.x
        positionsArray[i3 + 1] = position.y
        positionsArray[i3 + 2] = position.z

        sizesArray[i] = Math.random()
        timeMultipliersArray[i] = 1 + Math.random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))
    geometry.setAttribute('aTimeMultiplier', new THREE.BufferAttribute(timeMultipliersArray, 1))

    // Material
    texture.flipY = false
    const material = new THREE.ShaderMaterial({
        vertexShader: fireworkVertexShader,
        fragmentShader: fireworkFragmentShader,
        uniforms:
        {
            uSize: new THREE.Uniform(size),
            uResolution: new THREE.Uniform(sizes.resolution),
            uTexture: new THREE.Uniform(texture),
            uColor: new THREE.Uniform(color),
            uProgress: new THREE.Uniform(0),
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })

    // Points
    const firework = new THREE.Points(geometry, material)
    firework.position.copy(position)
    scene.add(firework)

    const destroy = () =>
    {
        scene.remove(firework)
        geometry.dispose()
        material.dispose()
    }

    // Animation
    gsap.to(
        material.uniforms.uProgress,
        { value: 1, duration: 3, ease: 'linear', onComplete: destroy }
    )
}

/**
 * Create Firework
 * @param {number} count
 * @param {THREE.Vector3} position
 * @param {number} size
 * @param {number} texture
 * @param {number} radius sphere radius
 * @param {THREE.Color} color
 * @returns {void}
 */

const createRandomFirework = () =>
{
    const count = Math.round(400 + Math.random() * 1000)
    const position = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random(),
        (Math.random() - 0.5) * 2
    )
    const size = 0.1 + Math.random() * 0.1
    const texture = textures[Math.floor(Math.random() * textures.length)]
    const radius = 0.5 + Math.random()
    const color = new THREE.Color(Math.random() * 0xffffff)

    createFirework(count, position, size, texture, radius, color)
}

// Create firework on click
window.addEventListener('click', () =>
{
    createRandomFirework()
})

// Sky
const sky = new Sky()
sky.material.uniforms.turbidity.value = 8
sky.material.uniforms.rayleigh.value = 2
sky.material.uniforms.mieCoefficient.value = 0.1
sky.material.uniforms.mieDirectionalG.value = 0.5
sky.material.uniforms.sunPosition.value = new THREE.Vector3(0.8, -0.05, -2)
sky.material.uniforms.sunPosition.value.normalize()
sky.scale.set(100,100,100)
scene.add(sky)

// Debug
gui.add(sky.material.uniforms.turbidity, 'value').min(0).max(20).step(0.01).name('turbidity')
gui.add(sky.material.uniforms.rayleigh, 'value').min(0).max(20).step(0.01).name('rayleigh')
gui.add(sky.material.uniforms.mieCoefficient, 'value').min(0).max(0.1).step(0.0001).name('mieCoefficient')
gui.add(sky.material.uniforms.mieDirectionalG, 'value').min(0).max(1).step(0.0001).name('mieDirectionalG')
gui.add(sky.material.uniforms.sunPosition.value, 'x').min(-1).max(1).step(0.0001).name('sunPositionX')

/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()