/**
 * turn angle into radians form.
 * @param angle angle to transform, range [0, 360]
 */
function angle_to_radians(angle: number): number {
	return Math.PI / 180 * angle;
}

enum ListenerType {
	PRE, POST
}

interface ListenerFunc {
	(emitter: ParticleEmitter);
	listenerID: number;
	type      : ListenerType;
	removed   : boolean;
}

class ParticleEmitter {
	private boundaryX      : [number, number];
	private boundaryY      : [number, number];
	private canvas         : HTMLCanvasElement;
	private canvasHeight   : number;
	private canvasWidth    : number;
	private context        : CanvasRenderingContext2D;
	private counter        : number;
	private listenerID     : number;
	private listenerMap    : Map<Function, number>;
	private origin         : Array<number>;             // emitter origin
	private particles      : Set<Particle>;
	private renderListeners: Array<ListenerFunc>;
	private staggeringCount: number;

	// particle config
	private color    : Function;
	private direction: Function;
	private size     : Function;
	private speed    : Function;
	private threshold: number;

	constructor(canvas: HTMLCanvasElement) {
		this.boundaryX       = [0, canvas.width];
		this.boundaryY       = [0, canvas.height];
		this.canvas          = canvas;
		this.canvasHeight    = canvas.height;
		this.canvasWidth     = canvas.width;
		this.context         = canvas.getContext('2d');
		this.origin          = [canvas.width / 2, canvas.height / 2];
		this.particles       = new Set();
		this.threshold       = 10;
		this.listenerID      = 0;
		this.renderListeners = [];
		this.listenerMap     = new Map();
		this.color           = () => 'white';
		this.direction       = this.default_direction_generator;
		this.speed           = () => 5;
		this.size            = () => 4;
	}
	tick() {
		this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.particles.add(
			new Particle(
				this,
				this.direction(),
				this.speed(),
				this.color(),
				this.size(),
				this.origin
			));
		for (let listener of this.renderListeners) {
			if (!listener.removed && listener.type === ListenerType.PRE)
				listener(this);
		}
		for (let particle of this.particles) particle.draw();
		for (let listener of this.renderListeners) {
			if (!listener.removed && listener.type === ListenerType.POST)
				listener(this);
		}
	}
	get_canvas() :HTMLCanvasElement{
		return this.canvas;
	}
	get_context(): CanvasRenderingContext2D {
		return this.context;
	}
	get_threshold(): number {
		return this.threshold;
	}
	get_origin(): Array<number> {
		return this.origin;
	}
	get_particle_count(): number {
		return this.particles.size;
	}
	set_origin(x: number, y: number) {
		this.origin[0] = x;
		this.origin[1] = y;
	}
	set_speed(speed: Function) {
		this.speed = speed;
	}
	set_direction(direction: Function) {
		this.direction = direction;
	}
	set_color(color: Function) {
		this.color = color;
	}
	set_size(size: Function) {
		this.size = size;
	}
	add_pre_render_listener(listener: ListenerFunc) {
		listener.listenerID = this.listenerID;
		listener.type       = ListenerType.PRE;
		listener.removed    = false;

		this.renderListeners.push(listener);
		this.listenerMap.set(listener, this.listenerID++);
	}
	remove_render_listener(listener: ListenerFunc) {
		let listenerID = this.listenerMap.get(listener);

		if (listenerID != undefined) {
			this.renderListeners[listenerID].removed = true;
			return true;
		}
		return false;
	}
	/**
	 * check if particle's coordinate exceeds the canvas' boundary.
	 * @param x particle's new x coordinate
	 * @param y particle's new y coordinate
	 */
	exceed_boundary(x: number, y: number): boolean {
		let threshold = this.threshold,
		    boundaryX = this.boundaryX,
		    boundaryY = this.boundaryY;

		if(x + threshold < boundaryX[0] || x - threshold > boundaryX[1]) return true;
		if(y + threshold < boundaryY[0] || y - threshold > boundaryY[1]) return true;
		return false;
	}
	/**
	 * remove particle from Set.
	 * @param particle particle to remove from Set
	 */
	kill_particle(particle: Particle) {
		this.particles.delete(particle);
	}
	private default_direction_generator(): number {
		return Math.floor(360 * Math.random());
	}
}

class Particle {
	// x: number;// current x coordinate
	// y: number;// current y coordinate
	private color     : string | Function;
	private coordinate: Array<number>;      // current coordinate [x,y[,z]]
	private direction : number|Function;
	private emitter   : ParticleEmitter;
	private size      : number|Function;
	private speed     : number|Function;
	/**
	 * @param direction angle, from 0 to 360
	 * @param speed moving speed
	 * @param color particle color
	 */
	constructor(
		emitter  : ParticleEmitter,
		direction: number | Function,
		speed    : number | Function,
		color    : string | Function,
		size     : number | Function,
		origin   : Array<number>) {
		this.color      = color;
		this.coordinate = origin.slice();
		this.direction  = direction;
		this.emitter    = emitter;
		this.size       = size;
		this.speed      = speed;
	}
	/**
	 * draw particle itself on canvas.
	 */
	draw() {
		let color     = this.color,
		    direction = this.direction,
		    speed     = this.speed,
		    size      = this.size,
		    context   = this.emitter.get_context();
				
		if (typeof color === 'function')
			color = color(this);
		if (typeof direction === 'function')
			direction = direction(this);
		if (typeof speed === 'function')
			speed = speed(this);
		if (typeof size === 'function')
			size = size(this);

		let newX = this.coordinate[0] + <number>speed * Math.cos(angle_to_radians(<number>direction)),
		    newY = this.coordinate[1] + <number>speed * Math.sin(angle_to_radians(<number>direction));

		if (this.emitter.exceed_boundary(newX, newY)) {
			this.destruct();
		}else{
			this.coordinate[0] = newX;
			this.coordinate[1] = newY;
			
			context.beginPath();
			context.fillStyle = <string>color;
			context.arc(newX, newY, <number>size, 0, 2 * Math.PI, false);
			context.fill();
		}
	}
	get_coordinate() {
		return this.coordinate.slice();
	}
	private destruct() {// eliminate this particle
		this.emitter.kill_particle(this);
	}
}

function main(interval: number) {
	let canvas    = <HTMLCanvasElement>document.getElementById('canvas');
	let indicator = document.getElementById('indicator');
	let emitter   = new ParticleEmitter(canvas);
	
	function play() {
		emitter.tick();
		setTimeout(play, interval);
	}
	
	function indicatorListener(emitter: ParticleEmitter) {
		indicator.innerHTML = `Particle count: ${emitter.get_particle_count()}`;
	}
	
	canvas.addEventListener('click', function (event) {
		emitter.set_origin(event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop);
	});
	
	emitter.add_pre_render_listener(<ListenerFunc>indicatorListener);
	emitter.set_speed(() => 1);
	emitter.set_size(() => 2);
	play();
}

main(30);