const wrap = document.getElementById('svg-wrap');
const svg = document.getElementById('sequencer-svg');
const styles = window.getComputedStyle(svg as HTMLElement);
const height = parseFloat(styles.height);
const width  = parseFloat(styles.width);
const factorY = 0.96*height/120;

export { wrap, svg, height, width, factorY };
