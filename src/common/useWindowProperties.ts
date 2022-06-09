import { createStore } from "solid-js/store";



const [windowProperties, setWindowProperties] = createStore({
  width: window.innerWidth,
  paneWidth: null as null | number
});



window.addEventListener("resize", () => {
  setWindowProperties('width', window.innerWidth)
})


function setPaneWidth(val: number) {
  setWindowProperties({ paneWidth: val });
}
export function useWindowProperties() {

  return {
    setPaneWidth,
    width: () => windowProperties.width,
    paneWidth: () => windowProperties.paneWidth,
  }
}