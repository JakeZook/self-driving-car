class Sensor {
	constructor(car) {
		this.car = car;
		this.rayCount = 5;
		this.rayLength = 150;
		// The angle of the rays
		this.raySpread = Math.PI / 2;

		this.rays = [];
		this.readings = [];
	}

	update(roadBorders, traffic) {
		this.#castRays();
		this.readings = [];

		// Get the readings of the rays
		for (let i = 0; i < this.rays.length; i++) {
			this.readings.push(this.#getReading(this.rays[i], roadBorders, traffic));
		}
	}

	#getReading(ray, roadBorders, traffic) {
		// Get the intersection of the ray with the road borders and traffic
		let touches = [];

		// Check for intersection with road borders
		for (let i = 0; i < roadBorders.length; i++) {
			const touch = getIntersection(
				ray[0],
				ray[1],
				roadBorders[i][0],
				roadBorders[i][1]
			);
			if (touch) {
				touches.push(touch);
			}
		}

		// Check for intersection with traffic
		for (let i = 0; i < traffic.length; i++) {
			const poly = traffic[i].polygon;
			for (let j = 0; j < poly.length; j++) {
				const touch = getIntersection(
					ray[0],
					ray[1],
					poly[j],
					poly[(j + 1) % poly.length]
				);
				if (touch) {
					touches.push(touch);
				}
			}
		}

		// Return the closest intersection
		if (touches.length == 0) {
			return null;
		} else {
			const offsets = touches.map((e) => e.offset);
			const minOffset = Math.min(...offsets);
			return touches.find((e) => e.offset == minOffset);
		}
	}

	#castRays() {
		// Cast rays in front of the car
		this.rays = [];
		for (let i = 0; i < this.rayCount; i++) {
			const rayAngle =
				lerp(
					this.raySpread / 2,
					-this.raySpread / 2,
					this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
				) + this.car.angle;

			// Calculate the start and end points of the ray
			const start = { x: this.car.x, y: this.car.y };
			const end = {
				x: this.car.x - Math.sin(rayAngle) * this.rayLength,
				y: this.car.y - Math.cos(rayAngle) * this.rayLength,
			};
			this.rays.push([start, end]);
		}
	}

	draw(ctx) {
		// Draw the rays
		for (let i = 0; i < this.rayCount; i++) {
			let end = this.rays[i][1];
			if (this.readings[i]) {
				end = this.readings[i];
			}

			// Draw the rays - no collision
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "yellow";
			ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();

			// Draw the rays - collision
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "red";
			ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		}
	}
}
