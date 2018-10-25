export function random_light_color_generator(variant?: number) {
	variant = Math.abs(variant);
	if (!variant){
		return () => {
			let randomR = Math.floor(Math.random() * 155) + 100,
			    randomG = Math.floor(Math.random() * 155) + 100,
			    randomB = Math.floor(Math.random() * 155) + 100;

			return `rgb(${randomR}, ${randomG}, ${randomB})`;
		}
	} else {
		return () => {
			let randomR = Math.floor(Math.random() * 155) + 100 - variant,
			    randomG = Math.floor(Math.random() * 155) + 100 - variant,
			    randomB = Math.floor(Math.random() * 155) + 100 - variant;
			return () => {
				let vRandomR = Math.floor(Math.random() * 2 * variant) + randomR,
				    vRandomG = Math.floor(Math.random() * 2 * variant) + randomG,
				    vRandomB = Math.floor(Math.random() * 2 * variant) + randomB;
				return `rgb(${vRandomR}, ${vRandomG}, ${vRandomB})`;
			}
		}
	}
}

// |variant| is recommanded to be less than 150
export function random_direction_generator(variant?: number) {
	variant = Math.abs(variant);
	if (!variant) {
		return () => Math.floor(360 * Math.random());
	} else {
		return () => {
			let randomDirection = Math.floor(360 * Math.random()),
			    reverseflag     = false
			return () => {
				let finalDirection = randomDirection;
				let randomVariant  = Math.floor(variant * Math.random());
				if (reverseflag) {
					reverseflag = false;
					if (randomDirection < randomVariant) {
						return 360 + randomDirection - randomVariant;
					}
					return randomDirection - randomVariant;
				} else {
					reverseflag = true;
					if (randomDirection + randomVariant > 360) {
						return randomDirection + randomVariant - 360;
					}
					return randomDirection + randomVariant;
				}
			}
		}
	}
}

export function radial_direction_generator(step?: number) {
	step = step || 1;

	let angle = 0;
	const limit = 360 - step - 1;
	return () => {
		if (angle > limit) angle = 0;
		else angle += step;
		return angle;
	}
}

export function random_size_generator(variant?: number) {
	variant = Math.abs(variant);
	if (!variant) {
		return () => Math.max(3, Math.floor(10 * Math.random()));
	}
	else {
		return () => {
			let randomSize = Math.max(3, Math.floor(10 * Math.random()));
			return () => {
				let randomVariant = Math.floor(variant * Math.random());
				return randomSize + randomVariant;
			};
		};
	}
}

export function exponential_attenuation_speed_generator(initialSpeed?: number, periodScale?: number) {
	initialSpeed = Math.abs(initialSpeed) || 7;
	periodScale = Math.abs(periodScale) || 100;

	let factor = Math.log(initialSpeed);
	let a = factor * periodScale;

	return () => {
		let x = 0;
		return () => Math.exp(a / ((x++) + periodScale));
	}
}
