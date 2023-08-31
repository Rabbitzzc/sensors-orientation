# sensors-orientation

<a href="https://imgse.com/i/pPwj35V"><img src="https://s1.ax1x.com/2023/08/31/pPwj35V.png" alt="pPwj35V.png" border="0" /></a>

A draggable DOM component that simulates Orientation, similar to the browser devtools, and matches the behavior of the browser devtools.

# Usage

## Demo

```sh
yarn 

yarn demo
```

## Install

```
yarn add orientation
```

## Use in Vue
```ts
import { ref, onMounted } from 'vue'
import registerOrientation from 'sensors-orientation'
import 'sensors-orientation/dist/index.css'


const manager = ref(null)

function reset() {
    manager.value.resetDeviceOrientation();
}

// 生命周期钩子
onMounted(() => {
  manager.value = registerOrientation(document.querySelector('.orientation'));
  manager.value.onChangeDeviceOrientation(args=>{
    console.error('onChangeDeviceOrientation', args);
  })
})
```

## API

###  registerOrientation
register orientation, use it first.

#### params

1. dom: `HTMLElement`

#### return

Return a manager of type `OrientationView`

### manager.resetDeviceOrientation

reset the orientation data to `[0, 90, 0]`

### onChangeDeviceOrientation

listens the orientation data changes and triggers a callback

#### params

1. callback: `ChangedFCType`
