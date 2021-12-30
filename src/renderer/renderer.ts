import * as THREE from 'three'
import { Color, WebGLRenderTarget } from 'three';

/**
 * ShadowMapType Enumeration.
 *  Wraps ThreeJS's shadow map type solutions; defaults to Variance Shadow Maps (VSM).
 */
enum ShadowMapType {
    None,           // Shadowing disabled.
    Minimal,        // Maps to THREE.BasicShadowMap.
    PCF,            // Maps to THREE.PCFShadowMap.
    PCFSoftShadows, // Maps to THREE.PCFSoftShadowMap.
    VSM             // Maps to Three.VSMShadowMap.
}

/**
 * TonemapperType Enumeration.
 *  Wrapping and extending ThreeJS's tonemapping types.
 *  See: https://64.github.io/tonemapping/
 *  Also: http://filmicworlds.com/blog/filmic-tonemapping-with-piecewise-power-curves/
 */
enum TonemapperType {
    None,           // Tonemapping disabled; maps roughly to THREE.NoToneMapping.
    Linear,         // Linearly-mapped color values; maps roughly to THREE.LinearToneMapping.
    Reinhard,       // Reinhard-based tonemapping implementation; maps roughly to THREE.ReinhardToneMapping. 
    Cineon,         // Cineon-type logarithmic cinematic tonemapping; maps to THREE.CineonToneMapping.
    ACES            // Default tonemapping solution; maps to THREE.ACESFilmicToneMapping. See: https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
}

/**
 * Renderer class definition.
 *  Renderer module for JoyGL built on ThreeJS's WebGL 2.0 renderer.
 */
 export default class Renderer {
    // ThreeJS-based WebGL renderer; kept private but still accessible through getRenderer. Should be manipulated internally almost exclusively (in practice). 
    private webglRenderer : THREE.WebGLRenderer;

    // Lighting.

    private shadowMapType : ShadowMapType = ShadowMapType.VSM;  // NOTE: Overridden in the constructor through ::setShadowMapType; however VSM is the default solution.

    // Postprocess.
    // TODO (trent, 12/30): do.

    /**
     * Renderer initialiation method.
     *  TODO (trent, 12/27): Parameterize the renderer setup a bit better. Well. At all, really.
     *  NOTE (trent, 12/27): https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
     * @returns Initialization success/failure.
     */
    public constructor( enableAntialiasing : boolean = false, enableShadowing : boolean = true ) {
        // Initialize Three WebGL renderer and necessary settings. Some enumerated here just so I don't forget they exist.
        this.webglRenderer = new THREE.WebGLRenderer( {
            precision: 'highp',             // options: "highp", "mediump" or "lowp".
            powerPreference: 'default',     // options: "high-performance", "low-power" or "default".
            alpha: false,                   // Three's default value.
            premultipliedAlpha: false,      // TODO (trent, 12/27): Revisit this setting.
            antialias: enableAntialiasing
        } );

        this.setShadowMapType( ( enableShadowing ) ? ShadowMapType.VSM : ShadowMapType.None );

        // Miscellaneous other settings.
        this.webglRenderer.setClearColor( new Color( 0.1, 0.1, 0.1 ), 1.0 );

        this.webglRenderer.setPixelRatio( 1.0 );

    //  physicallyCorrectLights: false
    //  toneMapping: THREE.NoToneMapping
    //  toneMappingExposure: 1.0
    }

    /**
     * Renderer destruction method.
     */
    public dispose( ) : void {
        // TODO (trent, 12/30): probably do more things here.
        this.webglRenderer.dispose( );
    }

    /**
     * Renderer accessor.
     */
    public getRenderer( ) : THREE.WebGLRenderer {
        return( this.webglRenderer as THREE.WebGLRenderer );
    }

    /**
     * Accessor for the renderer's DOM element.
     */
    public getDomElement( ) : HTMLCanvasElement {
        return( this.getRenderer( ).domElement );
    }

    /**
     * Set (or resize) the output canvas and updates the viewport to fit the specified size.
     * @param width Width in pixels.
     * @param height Height in pixels.
     */
    public setSize( width : number, height : number ) {
        this.getRenderer( ).setSize( width, height, false );
    }

    /**
     * Get renderer output canvas size.
     * @returns Size of the output canvas.
     */
    public getSize( ) : THREE.Vector2 {
        let size : THREE.Vector2 = new THREE.Vector2( );
        this.getRenderer( ).getSize( size );

        return size;
    }

    /**
     * Set the renderer's device pixel ratio. Defaults to 1.0.
     * @param pixelRatio Device pixel ratio for properly supporting high-DPU canvases.
     */
    public setPixelRatio( pixelRatio : number ) {
        this.getRenderer( ).setPixelRatio( pixelRatio );
    }

    /**
     * Accessor for the renderer's device pixel ratio.
     * @returns Renderer's current pixel ratio.
     */
    public getPixelRatio( ) : number {
        return( this.getRenderer( ).getPixelRatio( ) );
    }

    /**
     * Set the specified target for the renderer. 
     * @param renderTarget The render target; if null then the renderer targets the canvas.
     */
    public setRenderTarget( renderTarget : WebGLRenderTarget | null ) {
        this.getRenderer( ).setRenderTarget( renderTarget );
    }

    /**
     * Get the renderer's current render target.
     * @returns Returns the current render target; if null is returned, the canvas is the active target.
     */
    public getRenderTarget( ) : WebGLRenderTarget | null {
        return( this.getRenderer( ).getRenderTarget( ) );
    }

    /**
     * Render an object using the specified camera.
     */
    public render( obj : THREE.Object3D, camera : THREE.Camera ) : void {
        this.getRenderer( ).render( obj, camera );
    }

    /**
     * Render the current scene.
     *  TODO (trent, 12/28): THREE.Scene should be replaced by a wrapped object as, otherwise, THREE.Scene can also be renderered through the generic render method.
     */
    public renderFrame( scene : THREE.Scene, camera : THREE.Camera ) : void {
        this.getRenderer( ).render( scene, camera );
    }

    /**
     * Set the shadow mapping type.
     * @param shadowMapType Type of shadow mapping to support (if any). Default is ShadowMapType.VSM.
     */
    public setShadowMapType( shadowMapType : ShadowMapType ) {
        const wglRenderer = this.getRenderer( );

        // Set the shadow map type (if any) and associated renderer data.
        this.shadowMapType = shadowMapType;
        wglRenderer.shadowMap.enabled = ( this.shadowMapType !== ShadowMapType.None );

        switch( this.shadowMapType ) {
            case ShadowMapType.PCF:
                wglRenderer.shadowMap.type = THREE.PCFShadowMap;
                break;
            
            case ShadowMapType.PCFSoftShadows:
                wglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;

            case ShadowMapType.VSM:
                wglRenderer.shadowMap.type = THREE.VSMShadowMap;
                break;

            case ShadowMapType.Minimal:
            case ShadowMapType.None:
                wglRenderer.shadowMap.type = THREE.BasicShadowMap;
                break;
        }

        wglRenderer.shadowMap.needsUpdate = true;
    }

    /**
     * Accessor to shadow map type.
     * @returns Current ShadowMapType.
     */
    public getShadowMapType( ) : ShadowMapType {
        return this.shadowMapType;
    }

    /**
     * Method to gather and print render stats.
     *  TODO (trent, 12/28): Expand range of profiling/visualization of render stats... "Some day".
     */
    public logRenderStats( ) : void {
        const renderInfo : THREE.WebGLInfo = this.getRenderer( ).info;

        // Format output of high-level render stats.
        console.log( "Renderer Profile (Frame %d):\n Draw Calls: %d\n Meshes: %d\n Textures: %d\n Stats:\n\tPoints: %d\n\tLines: %d\n\tTriangles: %d", 
            renderInfo.render.frame,
            renderInfo.render.calls,
            renderInfo.memory.geometries,
            renderInfo.memory.textures,
            renderInfo.render.points,
            renderInfo.render.lines,
            renderInfo.render.triangles );
        
        // Log program object directly for further inspection.
        console.log( renderInfo.programs );
    }

    /**
     * Static Methods. 
     **/

    /**
     * Window resize event method.
     * @param renderer Renderer instance for resize handling.
     */
    public static onWindowResize( renderer : Renderer ) {
        renderer.getRenderer( ).setSize( window.innerWidth, window.innerHeight );
    }
 }