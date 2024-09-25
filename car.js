class Car {
	constructor(x, y, width, height, controlType, maxSpeed = 3) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		// The speed of the car
		this.speed = 0;
		this.acceleration = 0.2;
		this.maxSpeed = maxSpeed;
		this.friction = 0.05;

		// The angle of the car
		this.angle = 0;
		// If the car has collided with something
		this.damaged = false;

		// If the car is AI, use brain
		this.useBrain = controlType == "AI";

		// Only give the car a sensor if it is not a dummy
		if (controlType != "DUMMY") {
			this.sensor = new Sensor(this);
			this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
		}
		this.controls = new Controls(controlType);
	}

	update(roadBorders, traffic) {
		// If the car is damaged, do not update it
		if (!this.damaged) {
			this.#move();
			this.polygon = this.#createPolygon();
			this.damaged = this.#assessDamage(roadBorders, traffic);
		}
		// If the car has a sensor, update it
		if (this.sensor) {
			this.sensor.update(roadBorders, traffic);
			const offset = this.sensor.readings.map((s) =>
				s == null ? 0 : 1 - s.offset
			);
			const outputs = NeuralNetwork.feedForward(offset, this.brain);
			console.log(outputs);

			if (this.useBrain) {
				this.controls.forward = outputs[0];
				this.controls.left = outputs[1];
				this.controls.right = outputs[2];
				this.controls.reverse = outputs[3];
			}
		}
	}

	#assessDamage(roadBorders, traffic) {
		// Check if the car intersects with the road borders or traffic
		for (let i = 0; i < roadBorders.length; i++) {
			if (polysIntersect(this.polygon, roadBorders[i])) {
				return true;
			}
		}
		for (let i = 0; i < traffic.length; i++) {
			if (polysIntersect(this.polygon, traffic[i].polygon)) {
				return true;
			}
		}
	}

	#createPolygon() {
		// Create the polygon of the car
		const points = [];
		const rad = Math.hypot(this.width, this.height) / 2;
		const alpha = Math.atan2(this.width, this.height);
		points.push({
			x: this.x - Math.sin(this.angle - alpha) * rad,
			y: this.y - Math.cos(this.angle - alpha) * rad,
		});
		points.push({
			x: this.x - Math.sin(this.angle + alpha) * rad,
			y: this.y - Math.cos(this.angle + alpha) * rad,
		});
		points.push({
			x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
			y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
		});
		points.push({
			x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
			y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
		});
		return points;
	}

	#move() {
		// Move the car based on the controls
		if (this.controls.forward) {
			this.speed += this.acceleration;
		}
		if (this.controls.reverse) {
			this.speed -= this.acceleration;
		}

		// Limit the speed of the car
		if (this.speed > this.maxSpeed) {
			this.speed = this.maxSpeed;
		}
		if (this.speed < -this.maxSpeed / 2) {
			this.speed = -this.maxSpeed / 2;
		}

		// Apply friction to the speed
		if (this.speed > 0) {
			this.speed -= this.friction;
		}
		if (this.speed < 0) {
			this.speed += this.friction;
		}
		if (Math.abs(this.speed) < this.friction) {
			this.speed = 0;
		}

		// Rotate the car based on the controls
		if (this.speed != 0) {
			const flip = this.speed > 0 ? 1 : -1;
			if (this.controls.left) {
				this.angle += 0.03 * flip;
			}
			if (this.controls.right) {
				this.angle -= 0.03 * flip;
			}
		}

		// Move the car based on the speed and angle
		this.x -= Math.sin(this.angle) * this.speed;
		this.y -= Math.cos(this.angle) * this.speed;
	}

	draw(ctx) {
		// Change color of car to indicate damage
		if (this.damaged) {
			ctx.fillStyle = "red";
		} else {
			ctx.fillStyle = "blue";
		}

		// Draw the car
		ctx.beginPath();
		ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
		for (let i = 1; i < this.polygon.length; i++) {
			ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
		}
		ctx.fill();

		// Draw the sensor if the car has one
		if (this.sensor) this.sensor.draw(ctx);
	}
}
