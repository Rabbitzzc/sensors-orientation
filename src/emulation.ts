export class DeviceOrientation {
	alpha: number;
	beta: number;
	gamma: number;

	constructor(alpha: number, beta: number, gamma: number) {
		this.alpha = alpha;
		this.beta = beta;
		this.gamma = gamma;
	}

	static parseSetting(value: string): DeviceOrientation {
		if (value) {
			const jsonObject = JSON.parse(value);
			return new DeviceOrientation(
				jsonObject.alpha,
				jsonObject.beta,
				jsonObject.gamma
			);
		}
		return new DeviceOrientation(0, 0, 0);
	}

	/**
	 * 暂时不需要，后面支持 input 再处理
	 */
	static parseUserInput(
		alphaString: string,
		betaString: string,
		gammaString: string
	): DeviceOrientation | null {
		if (!alphaString && !betaString && !gammaString) {
			return null;
		}

		const { valid: isAlphaValid } =
			DeviceOrientation.alphaAngleValidator(alphaString);
		const { valid: isBetaValid } =
			DeviceOrientation.betaAngleValidator(betaString);
		const { valid: isGammaValid } =
			DeviceOrientation.gammaAngleValidator(gammaString);

		if (!isAlphaValid && !isBetaValid && !isGammaValid) {
			return null;
		}

		const alpha = isAlphaValid ? parseFloat(alphaString) : -1;
		const beta = isBetaValid ? parseFloat(betaString) : -1;
		const gamma = isGammaValid ? parseFloat(gammaString) : -1;

		return new DeviceOrientation(alpha, beta, gamma);
	}

	static angleRangeValidator(
		value: string,
		interval: {
			minimum: number;
			maximum: number;
		}
	): {
		valid: boolean;
		errorMessage: undefined;
	} {
		const numValue = parseFloat(value);
		const valid =
			/^([+-]?[\d]+(\.\d+)?|[+-]?\.\d+)$/.test(value) &&
			numValue >= interval.minimum &&
			numValue < interval.maximum;
		return { valid, errorMessage: undefined };
	}

	static alphaAngleValidator(value: string): {
		valid: boolean;
		errorMessage: string | undefined;
	} {
		return DeviceOrientation.angleRangeValidator(value, {
			minimum: -180,
			maximum: 180,
		});
	}

	static betaAngleValidator(value: string): {
		valid: boolean;
		errorMessage: string | undefined;
	} {
		return DeviceOrientation.angleRangeValidator(value, {
			minimum: -180,
			maximum: 180,
		});
	}

	static gammaAngleValidator(value: string): {
		valid: boolean;
		errorMessage: string | undefined;
	} {
		return DeviceOrientation.angleRangeValidator(value, {
			minimum: -90,
			maximum: 90,
		});
	}

	toSetting(): string {
		return JSON.stringify(this);
	}
}
