/**
 * 大致思路：
 * 1. 创建一个 DOM，包括所有信息....
 * 2. 创建一个 DragHandler，用来绑定 DOM 允许拖动
 * 3. 给创建的 DOM 绑定到 DragHandler
 */

import { OrientationView } from './ui';

const registerOrientation = (dom: HTMLElement) => {
	const manager = new OrientationView(dom);
	return manager;
};

export default registerOrientation;
