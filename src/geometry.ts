export const _Eps: number = 1e-5;

export const radiansToDegrees = function (rad: number): number {
	return (rad * 180) / Math.PI;
};

export class Vector {
	x: number;
	y: number;
	z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	normalize(): void {
		const length = this.length();
		if (length <= _Eps) {
			return;
		}

		this.x /= length;
		this.y /= length;
		this.z /= length;
	}
}

export class EulerAngles {
	alpha: number;
	beta: number;
	gamma: number;

	constructor(alpha: number, beta: number, gamma: number) {
		this.alpha = alpha;
		this.beta = beta;
		this.gamma = gamma;
	}

	static fromDeviceOrientationRotationMatrix(
		rotationMatrix: DOMMatrixReadOnly
	): EulerAngles {
		let alpha, beta, gamma;

		if (Math.abs(rotationMatrix.m33) < _Eps) {
			// m33 == 0
			if (Math.abs(rotationMatrix.m13) < _Eps) {
				alpha = Math.atan2(rotationMatrix.m12, rotationMatrix.m11);
				beta = rotationMatrix.m23 > 0 ? Math.PI / 2 : -(Math.PI / 2); // beta = +-pi/2
				gamma = 0; // gamma = 0
			} else if (rotationMatrix.m13 > 0) {
				// cos(gamma) == 0, cos(beta) > 0
				alpha = Math.atan2(-rotationMatrix.m21, rotationMatrix.m22);
				beta = Math.asin(rotationMatrix.m23); // beta [-pi/2, pi/2]
				gamma = -(Math.PI / 2); // gamma = -pi/2
			} else {
				// cos(gamma) == 0, cos(beta) < 0
				alpha = Math.atan2(rotationMatrix.m21, -rotationMatrix.m22);
				beta = -Math.asin(rotationMatrix.m23);
				beta += beta > 0 || Math.abs(beta) < _Eps ? -Math.PI : Math.PI; // beta [-pi,-pi/2) U (pi/2,pi)
				gamma = -(Math.PI / 2); // gamma = -pi/2
			}
		} else if (rotationMatrix.m33 > 0) {
			// cos(beta) > 0
			alpha = Math.atan2(-rotationMatrix.m21, rotationMatrix.m22);
			beta = Math.asin(rotationMatrix.m23); // beta (-pi/2, pi/2)
			gamma = Math.atan2(-rotationMatrix.m13, rotationMatrix.m33); // gamma (-pi/2, pi/2)
		} else {
			// cos(beta) < 0
			alpha = Math.atan2(rotationMatrix.m21, -rotationMatrix.m22);
			beta = -Math.asin(rotationMatrix.m23);
			beta += beta > 0 || Math.abs(beta) < _Eps ? -Math.PI : Math.PI; // beta [-pi,-pi/2) U (pi/2,pi)
			gamma = Math.atan2(rotationMatrix.m13, -rotationMatrix.m33); // gamma (-pi/2, pi/2)
		}

		// alpha is in [-pi, pi], make sure it is in [0, 2*pi).
		if (alpha < -_Eps) {
			alpha += 2 * Math.PI; // alpha [0, 2*pi)
		}

		alpha = Number(radiansToDegrees(alpha).toFixed(6));
		beta = Number(radiansToDegrees(beta).toFixed(6));
		gamma = Number(radiansToDegrees(gamma).toFixed(6));

		return new EulerAngles(alpha, beta, gamma);
	}
}

export const scalarProduct = function (u: Vector, v: Vector): number {
	return u.x * v.x + u.y * v.y + u.z * v.z;
};

export const calculateAngle = function (u: Vector, v: Vector): number {
	const uLength = u.length();
	const vLength = v.length();
	if (uLength <= _Eps || vLength <= _Eps) {
		return 0;
	}
	const cos = scalarProduct(u, v) / uLength / vLength;
	if (Math.abs(cos) > 1) {
		return 0;
	}
	return radiansToDegrees(Math.acos(cos));
};

export const crossProduct = function (u: Vector, v: Vector): Vector {
	const x = u.y * v.z - u.z * v.y;
	const y = u.z * v.x - u.x * v.z;
	const z = u.x * v.y - u.y * v.x;
	return new Vector(x, y, z);
};
