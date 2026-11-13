const NS = 'http://www.w3.org/2000/svg';

export default function createSVGElem(name: string, attrs: Record<string, string | number>){
    const elem = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(a=>{
	if( Number.isNaN(a[1]) ){
	    // console.log(a);
	}
	else elem.setAttribute(a[0], a[1].toString())
    });
    return elem;
};
