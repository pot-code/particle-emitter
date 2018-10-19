//QUES: 复用 particle 对象（越界自动复位），还是销毁再创建
//ANS: 先用创建销毁的方式确定一定速度下，空间最大粒子包容量，最后再确定具体容量
//TODO:
// - [ ] 加入控制面板
// - [x] canvas 背景颜色动画
// - [ ] 加入参数范围检查
// - [ ] 加入粒子发射器管理器，支持同一 canvas 多发射器
// - [ ] 模块化支持
function angle_to_radians(angle) {
    return Math.PI / 180 * angle;
}
var ListenerType;
(function (ListenerType) {
    ListenerType[ListenerType["PRE"] = 0] = "PRE";
    ListenerType[ListenerType["POST"] = 1] = "POST";
})(ListenerType || (ListenerType = {}));
class ParticleEmitter {
    constructor(canvas) {
        this.boundaryX = [0, canvas.width];
        this.boundaryY = [0, canvas.height];
        this.canvas = canvas;
        this.canvasHeight = canvas.height;
        this.canvasWidth = canvas.width;
        this.context = canvas.getContext('2d');
        this.origin = [canvas.width / 2, canvas.height / 2];
        this.particles = new Set();
        this.threshold = 10;
        this.listenerID = 0;
        this.renderListeners = [];
        this.listenerMap = new Map();
        this.color = () => 'white';
        this.direction = this.default_direction_generator;
        this.speed = () => 5;
        this.size = () => 4;
        // this.staggeringCount = 10;
        // this.counter         = 0;
    }
    tick() {
        // if (this.counter >= this.staggeringCount) {
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        // 	this.counter = 0;
        // }
        this.particles.add(new Particle(this, this.direction(), this.speed(), this.color(), this.size(), this.origin));
        for (let listener of this.renderListeners) {
            if (!listener.removed && listener.type === ListenerType.PRE)
                listener(this);
        }
        for (let particle of this.particles)
            particle.draw();
        for (let listener of this.renderListeners) {
            if (!listener.removed && listener.type === ListenerType.POST)
                listener(this);
        }
    }
    get_canvas() {
        return this.canvas;
    }
    get_context() {
        return this.context;
    }
    get_threshold() {
        return this.threshold;
    }
    get_origin() {
        return this.origin;
    }
    get_particle_count() {
        return this.particles.size;
    }
    set_origin(x, y) {
        this.origin[0] = x;
        this.origin[1] = y;
    }
    set_speed(speed) {
        this.speed = speed;
    }
    set_direction(direction) {
        this.direction = direction;
    }
    set_color(color) {
        this.color = color;
    }
    set_size(size) {
        this.size = size;
    }
    add_pre_render_listener(listener) {
        listener.listenerID = this.listenerID;
        listener.type = ListenerType.PRE;
        listener.removed = false;
        this.renderListeners.push(listener);
        this.listenerMap.set(listener, this.listenerID++);
    }
    remove_render_listener(listener) {
        let listenerID = this.listenerMap.get(listener);
        if (listenerID != undefined) {
            this.renderListeners[listenerID].removed = true;
            return true;
        }
        return false;
    }
    exceed_boundary(x, y) {
        let threshold = this.threshold, boundaryX = this.boundaryX, boundaryY = this.boundaryY;
        if (x + threshold < boundaryX[0] || x - threshold > boundaryX[1])
            return true;
        if (y + threshold < boundaryY[0] || y - threshold > boundaryY[1])
            return true;
        return false;
    }
    kill_particle(particle) {
        this.particles.delete(particle);
    }
    default_direction_generator() {
        return Math.floor(360 * Math.random());
    }
}
class Particle {
    /**
     * @param direction angle, from 0 to 360
     * @param speed moving speed
     * @param color particle color
     */
    constructor(emitter, direction, speed, color, size, origin) {
        this.color = color;
        this.coordinate = origin.slice();
        this.direction = direction;
        this.emitter = emitter;
        this.size = size;
        this.speed = speed;
    }
    draw() {
        let color = this.color, direction = this.direction, speed = this.speed, size = this.size, context = this.emitter.get_context();
        if (typeof color === 'function')
            color = color(this);
        if (typeof direction === 'function')
            direction = direction(this);
        if (typeof speed === 'function')
            speed = speed(this);
        if (typeof size === 'function')
            size = size(this);
        let newX = this.coordinate[0] + speed * Math.cos(angle_to_radians(direction)), newY = this.coordinate[1] + speed * Math.sin(angle_to_radians(direction));
        if (this.emitter.exceed_boundary(newX, newY)) {
            this.destruct();
        }
        else {
            this.coordinate[0] = newX;
            this.coordinate[1] = newY;
            context.beginPath();
            context.fillStyle = color;
            context.arc(newX, newY, size, 0, 2 * Math.PI, false);
            context.fill();
        }
    }
    get_coordinate() {
        return this.coordinate.slice(); // return copied coordinate
    }
    destruct() {
        this.emitter.kill_particle(this);
    }
}
function main(interval) {
    let canvas = document.getElementById('canvas');
    let indicator = document.getElementById('indicator');
    let emitter = new ParticleEmitter(canvas);
    function play() {
        emitter.tick();
        setTimeout(play, interval);
    }
    function indicatorListener(emitter) {
        indicator.innerHTML = `Particle count: ${emitter.get_particle_count()}`;
    }
    canvas.addEventListener('click', function (event) {
        emitter.set_origin(event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop);
    });
    emitter.add_pre_render_listener(indicatorListener);
    emitter.set_speed(() => 1);
    emitter.set_size(() => 2);
    play();
}
main(30);
