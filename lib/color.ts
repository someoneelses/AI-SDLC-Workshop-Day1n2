/** Pick whichever text color gives better WCAG contrast against a six-digit tag color. */
export function readableTagText(color:string):'#000000'|'#ffffff' {
  if(!/^#[0-9a-f]{6}$/i.test(color))return '#000000';
  const channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
  const luminance=channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  return (luminance+0.05)/0.05 >= 1.05/(luminance+0.05)?'#000000':'#ffffff';
}
