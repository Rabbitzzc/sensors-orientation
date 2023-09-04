import { OrientationView, OrientationType } from './ui';

/**
 *
 * @param dom bind dom
 * @returns OrientationView
 */
const registerOrientation = (dom: HTMLElement | Element) => {
	const manager = new OrientationView(dom);
	return manager;
};

export type { OrientationView, OrientationType };

export default registerOrientation;
