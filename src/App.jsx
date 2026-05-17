import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { addDoc, collection, onSnapshot, query, where, orderBy, getDocs, writeBatch, doc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "./firebase";
import AdminPage from "./AdminPage";
import AuthModal from "./AuthModal";


// ─── PRODUCT DATA (default seed run) ─────────
const DEFAULT_PRODUCTS = [
  { id:"zs-royal-brocade-maroon", name:"Royal Brocade Silk Saree – Wine Maroon", price:1299, original:11999, badge:"89% OFF", tags:["new","trending","festive","brocade","weaving"], fabric:"Silk Brocade", colors:["Wine Maroon","Antique Gold","Deep Plum"], images:["/assets/images/first-product-1.jpg","/assets/images/first-product-2.jpg"], description:"A rich brocade silk saree with luminous zari-inspired motifs, a grand pallu, and a regal drape for weddings, receptions, and festive evenings. Each piece is handpicked for quality.", rating:4.5, reviews:128 },
  { id:"zs-kanjivaram-emerald", name:"Kanjivaram Inspired Silk Saree – Emerald Gold", price:1499, original:12999, badge:"88% OFF", tags:["new","festive","kanjivaram","weaving","silk-borderline"], fabric:"Soft Silk", colors:["Emerald","Temple Gold","Peacock Blue"], images:["https://images.unsplash.com/photo-1610209843753-b7bd6c6ec1e2?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1709912305741-3bb372689f0e?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1549417229-aa67d3263c4f?auto=format&fit=crop&w=900&q=85"], description:"Temple-border styling meets a modern soft-silk finish. The body feels light, while the border keeps the traditional look crisp and festive.", rating:4.7, reviews:94 },
  { id:"zs-floral-printed-rose", name:"Modern Floral Printed Silk Saree – Rose Beige", price:999, original:8999, badge:"89% OFF", tags:["new","printed","flowers","trending","modern-print"], fabric:"Crepe Silk", colors:["Rose Beige","Blush Pink","Ivory"], images:["https://images.unsplash.com/photo-1669192324363-1ae5412cce34?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1732544893739-cf939e0ae81d?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1631137826736-a803bd2f79a0?auto=format&fit=crop&w=900&q=85"], description:"A graceful printed silk saree with painterly floral details and an easy drape for brunches, gifting, and lighter celebration days.", rating:4.4, reviews:211 },
  { id:"zs-contrast-pallu-sapphire", name:"Contrast Pallu Silk Saree – Sapphire Ruby", price:1199, original:10999, badge:"89% OFF", tags:["trending","contrast","contrast-pallu","festive","weaving"], fabric:"Art Silk", colors:["Sapphire Ruby","Royal Blue","Garnet"], images:["https://images.unsplash.com/photo-1532664189809-e02133fee698?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1641699862936-3626f6fd264c?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1709912305741-3bb372689f0e?auto=format&fit=crop&w=900&q=85"], description:"A bold contrast pallu saree designed to photograph beautifully, finished with a sheen that catches evening light.", rating:4.6, reviews:76 },
  { id:"zs-kalamkari-ivory", name:"Kalamkari Print Silk Saree – Ivory Crimson", price:1099, original:9999, badge:"89% OFF", tags:["printed","kalamkari","pallu-prints","new"], fabric:"Silk Blend", colors:["Ivory Crimson","Charcoal","Burnt Sienna"], images:["https://images.unsplash.com/photo-1732544893739-cf939e0ae81d?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1669192324363-1ae5412cce34?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1631137826736-a803bd2f79a0?auto=format&fit=crop&w=900&q=85"], description:"Heritage-inspired Kalamkari patterning on a lightweight silk blend, made for artful festive styling.", rating:4.3, reviews:58 },
  { id:"zs-zari-butti-saffron", name:"Zari Butti Silk Saree – Saffron Gold", price:1399, original:11999, badge:"88% OFF", tags:["weaving","zari-butti","traditional-mysore-silks","festive"], fabric:"Silk with Zari Butti", colors:["Saffron Gold","Copper","Marigold"], images:["https://images.unsplash.com/photo-1631983097767-099c77bf880d?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1610209843753-b7bd6c6ec1e2?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1549417229-aa67d3263c4f?auto=format&fit=crop&w=900&q=85"], description:"A warm saffron silk saree with delicate butti detailing and a festive gold-toned finish.", rating:4.8, reviews:145 },
  { id:"zs-hand-painted-lilac", name:"Hand Painted Design Silk Saree – Lilac Wine", price:1199, original:10499, badge:"89% OFF", tags:["printed","hand-painted","modern-print","trending"], fabric:"Soft Crepe Silk", colors:["Lilac Wine","Mauve","Lotus Pink"], images:["https://images.unsplash.com/photo-1631137826736-a803bd2f79a0?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1669192324363-1ae5412cce34?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1733423096251-0d7703972e96?auto=format&fit=crop&w=900&q=85"], description:"A soft, feminine printed saree with hand-painted styling and a refined wine-toned pallu.", rating:4.5, reviews:89 },
  { id:"zs-trendy-dress-gold", name:"Silk Festive Dress Set – Antique Gold", price:1599, original:13999, badge:"89% OFF", tags:["dresses","trending","festive"], fabric:"Silk Blend Dress Set", colors:["Antique Gold","Cocoa","Black Gold"], images:["https://images.unsplash.com/photo-1709912305741-3bb372689f0e?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1641699862936-3626f6fd264c?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1610209843753-b7bd6c6ec1e2?auto=format&fit=crop&w=900&q=85"], description:"A dress set for shoppers who want silk-inspired festive texture with faster styling and an easy fit.", rating:4.6, reviews:167 },
];

const COLLECTIONS = {
  festive:["Festive Sale","Rich occasionwear with dramatic pallu, luminous borders, and bundle savings."],
  new:["New Arrivals","Fresh silk sarees, ornate brocades, printed pallus, and festive borders."],
  trending:["Trending","Customer-favorite silk styles in deep festive colors and easy drapes."],
  weaving:["Weaving","Brocade, zari, contrast pallu, and traditional weaving-inspired edits."],
  printed:["Printed","Painterly florals, Kalamkari motifs, and modern printed silk looks."],
  brocade:["Silks in Brocade","Opulent brocade pieces with rich motifs and celebratory shine."],
  kanjivaram:["Silk in Kanjivaram","Temple border styling and heritage-inspired silk sarees."],
  contrast:["Silk in Contrast","Bold color pairings built around striking borders and pallus."],
  "zari-butti":["Silk with Zari Butti","Tiny butti details and festive gold-toned accents."],
  "contrast-pallu":["Silk with Contrast Pallu","Statement pallus with memorable color blocking."],
  "traditional-mysore-silks":["Traditional Mysore Silks","Classic silk saree silhouettes with heritage cues."],
  "hand-painted":["Hand Painted Design","Artful printed sarees with brushstroke-inspired motifs."],
  "modern-print":["Modern Print","Contemporary prints for light festive styling."],
  kalamkari:["Kalamkari Prints","Heritage art motifs reimagined for modern wardrobes."],
  flowers:["Flowers Prints","Floral silk sarees in soft colors and elegant repeats."],
  "pallu-prints":["Pallu Prints","Printed pallus that make the drape the focal point."],
  dresses:["Trendy Dresses","Silk-inspired festive dresses and ready-to-style pieces."],
  "silk-borderline":["Silk Borderline","Border-led sarees with refined festive finishing."],
};

// ─── Products context — all components read from here ─────────────────────────
const ProductsCtx = createContext(DEFAULT_PRODUCTS);

const BANKS = ["State Bank of India","HDFC Bank","ICICI Bank","Axis Bank","Kotak Mahindra Bank","Punjab National Bank","Bank of Baroda","Canara Bank","Union Bank of India","Yes Bank","IndusInd Bank","IDFC First Bank","Federal Bank","South Indian Bank"];
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"];


// Admin authentication is now handled securely via Firebase — see src/AdminPage.jsx

const fmt = v => `₹${Number(v).toLocaleString("en-IN")}`;
const genId = () => "LS" + Date.now().toString(36).toUpperCase().slice(-7);
const today = () => new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

function cartTotals(cart, products) {
  const count = cart.reduce((s,i) => s+i.qty, 0);
  const sub = cart.reduce((s,i) => { const p=products.find(x=>x.id===i.id); return s+(p?p.price*i.qty:0); }, 0);
  const rate = count>=4?.25:count>=3?.20:count>=2?.15:0;
  const disc = Math.round(sub*rate);
  const ship = sub>=999?0:99;
  return { count, sub, disc, ship, total: sub-disc+ship };
}

// ═══════════════════════ GLOBAL CSS ═══════════════════════════════════════
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=EB+Garamond:wght@400;500;600&family=Josefin+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --m950:#240506;--m900:#3b0909;--m800:#551010;--m700:#7a1c1c;--m600:#9b2731;
  --g700:#a77918;--g600:#c89c32;--g400:#e3c667;--g200:#f8e9b1;
  --cr1:#fffaf0;--cr2:#f8edd7;--cr3:#eddbbb;
  --ink:#2a0d0d;--muted:#7b5b55;--border:rgba(122,28,28,.14);
  --display:'Cormorant Garamond',Georgia,serif;
  --body:'EB Garamond',Georgia,serif;
  --ui:'Josefin Sans',Arial,sans-serif;
  --max:1240px;
}
html{scroll-behavior:smooth}
body{font-family:var(--body);font-size:16px;line-height:1.65;color:var(--ink);background:var(--cr1);overflow-x:hidden}
body.noscroll{overflow:hidden}
img{max-width:100%;display:block}
a,button{cursor:pointer}
input,select,textarea,button{font:inherit}


/* FEATURE STRIP */
.fstrip{display:grid;grid-template-columns:repeat(4,1fr);background:var(--m900)}
.fstrip-item{display:flex;align-items:center;gap:12px;padding:18px 20px;border-right:1px solid rgba(255,250,240,.08)}
.fstrip-item:last-child{border-right:none}
.fstrip-icon{font-size:20px;flex-shrink:0}
.fstrip-item h4{font-family:var(--ui);font-size:12px;font-weight:700;color:var(--g200);letter-spacing:.04em;margin-bottom:2px}
.fstrip-item p{font-family:var(--ui);font-size:10px;color:rgba(248,233,177,.55);letter-spacing:.03em}
@media(max-width:760px){.fstrip{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.fstrip{grid-template-columns:1fr}}


/* INSTAGRAM GRID */
.insta-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:3px}
.insta-item{aspect-ratio:1;overflow:hidden;position:relative;cursor:pointer}
.insta-item img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.insta-item:hover img{transform:scale(1.1)}
.insta-overlay{position:absolute;inset:0;background:rgba(36,5,6,.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .28s}
.insta-item:hover .insta-overlay{opacity:1}
.insta-overlay span{color:#fff;font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.12em}
@media(max-width:760px){.insta-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:480px){.insta-grid{grid-template-columns:repeat(2,1fr)}}

/* ANN */
.ann{overflow:hidden;color:var(--g200);background:var(--m950);border-bottom:1px solid rgba(227,198,103,.2);font-family:var(--ui);font-size:11px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
.ann-track{display:inline-flex;min-width:max-content;animation:marquee 26s linear infinite}
.ann-track span{display:inline-flex;align-items:center;min-height:34px;padding:0 22px}
.ann-track span::after{content:'·';margin-left:22px;color:var(--g600)}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* HEADER */
.hdr{position:sticky;top:0;z-index:120;background:rgba(255,250,240,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:box-shadow .2s}
.hdr.up{box-shadow:0 4px 24px rgba(49,8,8,.1)}
.hdr-inner{width:min(var(--max),calc(100% - 24px));min-height:68px;margin:0 auto;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px}
.brand{display:inline-flex;align-items:center;gap:10px;cursor:pointer;min-width:max-content}
.brand strong{display:block;color:var(--m900);font-family:var(--display);font-size:26px;line-height:.9;letter-spacing:.02em}
.brand small{display:block;margin-top:4px;color:var(--g700);font-family:var(--ui);font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.dnav{display:flex;align-items:center;gap:2px;font-family:var(--ui);font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase}
.dnav a,.ndrop>span{padding:6px 9px;border-radius:6px;color:var(--m800);transition:background .14s;white-space:nowrap;cursor:pointer}
.dnav a:hover,.ndrop:hover>span{background:var(--cr2);color:var(--m900)}
.ndrop{position:relative}
.ndrop:hover .ddrop{display:block}
.ddrop{display:none;position:absolute;top:100%;left:0;min-width:210px;background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:0 16px 40px rgba(49,8,8,.12);padding:6px 0;z-index:220;margin-top:4px}
.ddrop a{display:block;padding:8px 16px;font-size:11px;letter-spacing:.05em;color:var(--m700);transition:background .1s;cursor:pointer}
.ddrop a:hover{background:var(--cr2)}
.hact{display:flex;align-items:center;gap:4px}
.ibtn{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9px;color:var(--m800);transition:background .14s;position:relative;border:none;background:none}
.ibtn:hover{background:var(--cr2)}
.ibtn svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.cbadge{position:absolute;top:3px;right:3px;background:var(--m700);color:#fff;font-family:var(--ui);font-size:9px;font-weight:700;min-width:15px;height:15px;border-radius:99px;display:flex;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid var(--cr1)}
.nbadge{position:absolute;top:3px;right:3px;background:#e53e3e;color:#fff;font-family:var(--ui);font-size:9px;font-weight:700;min-width:15px;height:15px;border-radius:99px;display:flex;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid var(--cr1)}
.mtoggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:4px;width:38px;height:38px;border-radius:9px;border:none;background:none;transition:background .14s}
.mtoggle:hover{background:var(--cr2)}
.mtoggle span{display:block;width:20px;height:1.8px;background:var(--m800);border-radius:1px;transition:all .2s}

/* MOB MENU */
.mmenu{position:fixed;top:0;left:-100%;width:min(300px,88vw);height:100vh;background:#fff;z-index:350;overflow-y:auto;transition:left .26s cubic-bezier(.4,0,.2,1);border-right:1px solid var(--border);box-shadow:4px 0 20px rgba(49,8,8,.12)}
.mmenu.open{left:0}
.mmhead{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--m950);border-bottom:1px solid rgba(227,198,103,.2)}
.mmhead strong{color:var(--g200);font-family:var(--display);font-size:20px}
.mmhead button{color:var(--g400);font-size:22px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:7px;border:none;background:none}
.mmenu a,.mdet summary{display:block;padding:11px 18px;font-family:var(--ui);font-size:12px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--m800);border-bottom:1px solid rgba(122,28,28,.06);cursor:pointer;transition:background .1s}
.mmenu a:hover,.mdet summary:hover{background:var(--cr2)}
.mdet a{padding:9px 18px 9px 34px;font-size:11px;font-weight:500;text-transform:none;letter-spacing:.04em;color:var(--m600)}
.mdet summary{list-style:none}
.mdet summary::marker{display:none}

/* OVERLAY */
.overlay{position:fixed;inset:0;background:rgba(36,5,6,.5);z-index:200;opacity:0;pointer-events:none;transition:opacity .22s;backdrop-filter:blur(2px)}
.overlay.on{opacity:1;pointer-events:all}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 22px;border-radius:8px;font-family:var(--ui);font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;transition:all .16s;cursor:pointer;border:none;white-space:nowrap}
.btn-gold{background:var(--g600);color:var(--m950)}
.btn-gold:hover{background:var(--g700)}
.btn-ghost{background:transparent;border:2px solid rgba(255,250,240,.55);color:#fff}
.btn-ghost:hover{background:rgba(255,250,240,.1)}
.btn-outline{background:transparent;border:1.5px solid var(--m700);color:var(--m700)}
.btn-outline:hover{background:var(--cr2)}
.btn-dark{background:var(--m900);color:var(--g200)}
.btn-dark:hover{background:var(--m800)}
.btn-red{background:#e53e3e;color:#fff}
.btn-red:hover{background:#c53030}
.btn-sm{padding:8px 16px;font-size:11px}
.btn-lg{padding:14px 28px;font-size:13px}
.btn-full{width:100%}
.btn:disabled{opacity:.5;cursor:not-allowed}

/* HERO */
.hero{position:relative;min-height:min(88vh,660px);display:flex;align-items:center;overflow:hidden}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-shade{position:absolute;inset:0;background:linear-gradient(to right,rgba(36,5,6,.75) 0%,rgba(36,5,6,.18) 100%)}
.hero-c{position:relative;z-index:2;padding:40px min(64px,6vw);max-width:580px}
.eyebrow{font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--g400);margin-bottom:10px}
.hero-c h1{font-family:var(--display);font-size:clamp(2rem,5vw,3.5rem);font-weight:700;color:#fff;line-height:1.1;margin-bottom:14px}
.hero-c p{color:rgba(255,250,240,.8);font-size:1.05rem;margin-bottom:26px;max-width:420px}
.hero-btns{display:flex;gap:10px;flex-wrap:wrap}

/* SECTION */
.sec{padding:64px min(40px,4vw)}
.sec-inner{max-width:var(--max);margin:0 auto}
.sec--cream{background:var(--cr2)}
.sec--dark{background:var(--m950)}
.sec-head{text-align:center;margin-bottom:40px}
.sec-head h2{font-family:var(--display);font-size:clamp(1.7rem,3vw,2.6rem);font-weight:700;color:var(--m900);margin:8px 0}
.sec-head p{color:var(--muted);max-width:500px;margin:0 auto}
.sec-head-dark h2{color:var(--g200)}
.sec-head-dark p{color:var(--g400)}
.sec-head-dark .eyebrow{color:var(--g400)}

/* PRODUCT GRID & CARD */
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:20px}
.pcard{border-radius:12px;overflow:hidden;background:#fff;border:1px solid var(--border);transition:box-shadow .2s,transform .2s;position:relative}
.pcard:hover{box-shadow:0 12px 36px rgba(49,8,8,.13);transform:translateY(-2px)}
.pcard-media{position:relative;aspect-ratio:3/4;overflow:hidden;cursor:pointer}
.pcard-media img{width:100%;height:100%;object-fit:cover;transition:transform .35s}
.pcard:hover .pcard-media img{transform:scale(1.05)}
.pcbadge{position:absolute;top:8px;left:8px;background:var(--m700);color:#fff;font-family:var(--ui);font-size:10px;font-weight:700;padding:3px 7px;border-radius:4px;z-index:2}
.wishlist-btn{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;border:none;color:var(--muted);font-size:16px;z-index:2;transition:all .15s}
.wishlist-btn:hover{background:#fff;color:#e53e3e}
.pcard-body{padding:12px 14px 14px}
.pcard-title{display:block;font-family:var(--body);font-weight:600;font-size:14px;color:var(--ink);line-height:1.3;margin-bottom:6px;cursor:pointer;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pcard-title:hover{color:var(--m700)}
.price-row{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;margin-bottom:4px}
.sale-price{font-family:var(--ui);font-size:15px;font-weight:700;color:var(--m900)}
.og-price{font-size:12px;color:var(--muted);text-decoration:line-through}
.save-tag{font-family:var(--ui);font-size:10px;font-weight:700;color:#276749;background:#c6f6d5;padding:2px 5px;border-radius:3px}
.pcard-rating{display:flex;align-items:center;gap:4px;margin-bottom:10px}
.stars{color:#f6ad55;font-size:12px}
.rcount{font-family:var(--ui);font-size:10px;color:var(--muted)}
.pcard-actions{display:flex;gap:8px}
.pcard-actions .btn{flex:1;padding:8px 6px;font-size:10px}

/* OFFER BAND */
.oband{display:grid;grid-template-columns:repeat(3,1fr);background:var(--m900)}
.oband article{padding:32px 20px;text-align:center;border-right:1px solid rgba(255,250,240,.1)}
.oband article:last-child{border-right:none}
.oband span{font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--g400)}
.oband h3{font-family:var(--display);font-size:1.7rem;color:#fff;margin:5px 0 12px}
.oband a{display:inline-block;padding:7px 18px;border:1.5px solid var(--g400);color:var(--g400);font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;border-radius:6px;transition:all .16s;cursor:pointer}
.oband a:hover{background:var(--g400);color:var(--m950)}

/* STORY GRID */
.sgrid{display:grid;grid-template-columns:3fr 2fr 2fr;gap:14px;max-width:var(--max);margin:0 auto;padding:0 min(40px,4vw)}
.scard{position:relative;border-radius:12px;overflow:hidden;cursor:pointer;display:block}
.scard img{width:100%;height:100%;object-fit:cover;min-height:180px;transition:transform .35s}
.scard:hover img{transform:scale(1.04)}
.scard--wide{min-height:340px}
.scard:not(.scard--wide){min-height:162px}
.scard span{position:absolute;top:12px;left:12px;background:rgba(36,5,6,.65);color:var(--g200);font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;border-radius:4px}
.scard strong{position:absolute;bottom:12px;left:12px;right:12px;color:#fff;font-family:var(--display);font-size:1rem;font-weight:600;line-height:1.2}

/* REVIEWS */
.rev-sec{padding:64px min(40px,4vw);background:var(--m950)}
.rev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;max-width:var(--max);margin:0 auto}
.rev-grid figure{background:rgba(255,250,240,.06);border:1px solid rgba(227,198,103,.18);border-radius:12px;padding:22px;color:var(--g200)}
.rev-grid blockquote{font-size:.95rem;line-height:1.6;font-style:italic;margin-bottom:10px}
.rev-grid figcaption{font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--g400)}

/* NEWSLETTER */
.nl{padding:56px min(40px,4vw);background:var(--cr3);display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:center}
.nl h2{font-family:var(--display);font-size:1.9rem;color:var(--m900);margin:6px 0}
.nl p{color:var(--muted)}
.nlf{display:flex;gap:8px}
.nlf input{flex:1;padding:11px 15px;border:1.5px solid var(--border);border-radius:8px;background:#fff;color:var(--ink);font-size:14px;outline:none}
.nlf input:focus{border-color:var(--m700)}

/* FOOTER */
.footer{background:var(--m950);color:var(--g200);padding:56px min(40px,4vw) 0}
.fgrid{display:grid;grid-template-columns:2fr 1fr 1fr 1.5fr;gap:36px;max-width:var(--max);margin:0 auto}
.footer h3{font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--g400);margin-bottom:14px}
.footer a{display:block;font-size:13px;color:rgba(248,233,177,.65);margin-bottom:7px;transition:color .14s;cursor:pointer}
.footer a:hover{color:var(--g200)}
.footer p{font-size:13px;color:rgba(248,233,177,.65);margin-bottom:5px}
.fbot{border-top:1px solid rgba(227,198,103,.12);margin-top:44px;padding:18px 0;text-align:center;font-family:var(--ui);font-size:10px;color:rgba(248,233,177,.4);letter-spacing:.06em;max-width:var(--max);margin:44px auto 0}
.socials{display:flex;gap:8px;margin-top:14px}
.socials a{display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(227,198,103,.12);border-radius:8px;color:var(--g400);font-family:var(--ui);font-size:11px;font-weight:700;transition:background .14s}
.socials a:hover{background:rgba(227,198,103,.25)}

/* CART DRAWER */
.cdrawer{position:fixed;right:-420px;top:0;width:min(420px,100vw);height:100vh;background:#fff;z-index:350;box-shadow:-6px 0 32px rgba(49,8,8,.14);transition:right .26s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column}
.cdrawer.open{right:0}
.dhead{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border);background:var(--m950)}
.dhead h2{font-family:var(--display);font-size:1.4rem;color:var(--g200)}
.dhead button{color:var(--g400);font-size:22px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:7px;border:none;background:none}
.citems{flex:1;overflow-y:auto;padding:14px}
.cempty{text-align:center;padding:36px 18px;color:var(--muted);font-style:italic}
.citem{display:grid;grid-template-columns:72px 1fr;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.citem img{width:72px;height:72px;object-fit:cover;border-radius:8px}
.citem h3{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:3px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.citem p{font-size:12px;color:var(--muted);margin-bottom:7px}
.citem-row{display:flex;align-items:center;justify-content:space-between}
.mqty{display:flex;align-items:center;border:1px solid var(--border);border-radius:6px;overflow:hidden}
.mqty button{width:26px;height:26px;display:flex;align-items:center;justify-content:center;color:var(--m700);font-size:15px;border:none;background:#fff;transition:background .1s}
.mqty button:hover{background:var(--cr2)}
.mqty span{min-width:26px;text-align:center;font-family:var(--ui);font-size:12px;font-weight:700;color:var(--ink);border-left:1px solid var(--border);border-right:1px solid var(--border)}
.rmbtn{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#c53030;border:none;background:none;transition:color .12s;cursor:pointer}
.rmbtn:hover{color:#9b2c2c}
.csumm{padding:14px 22px;border-top:1px solid var(--border);background:var(--cr2)}
.csrow{display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:6px}
.csrow strong{color:var(--ink)}
.ctrow{display:flex;justify-content:space-between;font-family:var(--ui);font-size:15px;font-weight:700;color:var(--m900);padding-top:10px;border-top:1px solid var(--border);margin-bottom:14px}
.binfo{font-family:var(--ui);font-size:11px;color:#276749;font-weight:700;text-align:center;background:#c6f6d5;padding:6px;border-radius:6px;margin-bottom:10px}
.cdrawer-actions{display:flex;flex-direction:column;gap:8px}

/* SEARCH MODAL */
.smodal{position:fixed;inset:0;background:rgba(36,5,6,.6);z-index:400;display:flex;align-items:flex-start;justify-content:center;padding-top:70px;opacity:0;pointer-events:none;transition:opacity .18s}
.smodal.open{opacity:1;pointer-events:all}
.sbox{background:#fff;border-radius:14px;width:min(620px,92vw);padding:22px;box-shadow:0 20px 60px rgba(49,8,8,.2)}
.sbox h2{font-family:var(--display);font-size:1.3rem;color:var(--m900);margin-bottom:14px}
.sinput{width:100%;padding:11px 15px;border:1.5px solid var(--border);border-radius:9px;font-size:15px;color:var(--ink);outline:none}
.sinput:focus{border-color:var(--m700)}
.sresult{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;padding:9px 8px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;border-radius:8px}
.sresult:hover{background:var(--cr2);border-bottom-color:transparent}
.sresult img{width:56px;height:56px;object-fit:cover;border-radius:7px}
.sresult strong{display:block;font-size:13px;color:var(--ink);font-weight:600;margin-bottom:1px}
.sresult small{font-size:12px;color:var(--muted)}

/* PRODUCTS PAGE */
.ppage{max-width:var(--max);margin:0 auto;padding:32px min(28px,3vw)}
.playout{display:grid;grid-template-columns:210px 1fr;gap:28px;align-items:start}
.filters{background:#fff;border:1px solid var(--border);border-radius:12px;padding:18px;position:sticky;top:82px}
.fhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.fhead h3{font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--m800)}
.clearbtn{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--m600);background:none;border:none;cursor:pointer}
.filter-group{margin-bottom:16px}
.filter-group h4{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.filter-group label{display:flex;align-items:center;gap:7px;padding:5px 0;font-size:13px;color:var(--ink);cursor:pointer}
.filter-group label:hover{color:var(--m700)}
.filter-group input[type=checkbox]{accent-color:var(--m700);width:14px;height:14px}
.collhead{margin-bottom:24px}
.collhead h1{font-family:var(--display);font-size:clamp(1.7rem,3vw,2.3rem);font-weight:700;color:var(--m900);margin-bottom:6px}
.collhead p{color:var(--muted);font-size:15px}
.collmeta{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px}
.collcount{font-family:var(--ui);font-size:12px;color:var(--muted)}
.sortsel{padding:7px 11px;border:1px solid var(--border);border-radius:7px;font-family:var(--ui);font-size:11px;font-weight:600;color:var(--m800);background:#fff;letter-spacing:.05em;cursor:pointer;outline:none}

/* PRODUCT DETAIL */
.dpage{max-width:var(--max);margin:0 auto;padding:32px min(28px,3vw)}
.dlayout{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:start}
.gallery{display:grid;grid-template-columns:72px 1fr;gap:10px}
.thumbs{display:flex;flex-direction:column;gap:7px}
.tbtn{border:2px solid transparent;border-radius:8px;overflow:hidden;cursor:pointer;padding:0;background:none;transition:border-color .14s}
.tbtn.act{border-color:var(--m700)}
.tbtn img{width:72px;height:72px;object-fit:cover;display:block}
.mimg{border-radius:12px;overflow:hidden;aspect-ratio:3/4;background:var(--cr2)}
.mimg img{width:100%;height:100%;object-fit:cover}
.dinfo .eyebrow{color:var(--g700);margin-bottom:6px}
.dinfo h1{font-family:var(--display);font-size:clamp(1.5rem,2.8vw,2rem);font-weight:700;color:var(--m900);margin-bottom:12px;line-height:1.2}
.dprice{display:flex;align-items:baseline;gap:10px;margin-bottom:8px;flex-wrap:wrap}
.dprice .sp{font-family:var(--ui);font-size:1.6rem;font-weight:700;color:var(--m900)}
.dprice .op{font-size:1rem;color:var(--muted);text-decoration:line-through}
.dprice .sv{font-family:var(--ui);font-size:12px;font-weight:700;color:#276749;background:#c6f6d5;padding:3px 8px;border-radius:4px}
.drating{display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.drating .sbox2{background:var(--m700);color:#fff;font-family:var(--ui);font-size:12px;font-weight:700;padding:3px 8px;border-radius:4px}
.rtext{font-family:var(--ui);font-size:12px;color:var(--muted)}
.ddesc{color:var(--muted);margin-bottom:20px;line-height:1.7;font-size:15px}
.vgroup{margin-bottom:18px}
.vgroup>label{font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px}
.swatches{display:flex;gap:7px;flex-wrap:wrap}
.swatch{padding:6px 13px;border:1.5px solid var(--border);border-radius:6px;font-family:var(--ui);font-size:11px;font-weight:600;color:var(--m700);background:#fff;transition:all .14s;cursor:pointer}
.swatch.act,.swatch:hover{border-color:var(--m700);background:var(--cr2)}
.qty-wrap{margin-bottom:20px}
.qty-wrap>label{font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px}
.qstep{display:inline-flex;align-items:center;border:1.5px solid var(--border);border-radius:8px;overflow:hidden}
.qstep button{width:38px;height:38px;font-size:17px;color:var(--m700);background:#fff;border:none;transition:background .1s}
.qstep button:hover{background:var(--cr2)}
.qstep input{width:52px;text-align:center;font-family:var(--ui);font-size:14px;font-weight:700;color:var(--ink);border:none;border-left:1.5px solid var(--border);border-right:1.5px solid var(--border);height:38px;-moz-appearance:textfield;outline:none}
.qstep input::-webkit-outer-spin-button,.qstep input::-webkit-inner-spin-button{-webkit-appearance:none}
.dactions{display:flex;flex-direction:column;gap:9px;margin-bottom:18px}
.perks{display:flex;flex-direction:column;gap:7px;padding:14px;background:var(--cr2);border-radius:10px;margin-bottom:18px}
.perks span{font-family:var(--ui);font-size:11px;color:var(--m800);font-weight:600;letter-spacing:.04em;display:flex;align-items:center;gap:7px}
.perks span::before{content:'✓';color:var(--g700);font-size:13px;font-weight:900}
.delinfo{background:#fff;border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:18px}
.delinfo label{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:7px}
.delinfo-row{display:flex;gap:8px}
.delinfo-row input{flex:1;padding:9px 12px;border:1.5px solid var(--border);border-radius:7px;font-size:13px;color:var(--ink);outline:none}
.delinfo-row input:focus{border-color:var(--m700)}
.del-result{font-family:var(--ui);font-size:11px;font-weight:700;color:#276749;margin-top:8px}
.breadcrumb{font-family:var(--ui);font-size:11px;color:var(--muted);letter-spacing:.05em;padding:14px min(28px,3vw);max-width:var(--max);margin:0 auto;display:flex;gap:7px;align-items:center}
.breadcrumb a{cursor:pointer;transition:color .14s}
.breadcrumb a:hover{color:var(--m700)}

/* CART PAGE */
.cartpage{max-width:var(--max);margin:0 auto;padding:32px min(28px,3vw)}
.cartpage h1{font-family:var(--display);font-size:1.9rem;color:var(--m900);margin-bottom:24px}
.cart-layout{display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start}
.cart-items-list{background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.ci-head{padding:14px 20px;background:var(--cr2);border-bottom:1px solid var(--border);font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--m800)}
.ci{display:grid;grid-template-columns:100px 1fr auto;gap:16px;padding:18px 20px;border-bottom:1px solid var(--border);align-items:start}
.ci:last-child{border-bottom:none}
.ci img{width:100px;height:120px;object-fit:cover;border-radius:8px;cursor:pointer}
.ci-info h3{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:4px;line-height:1.3;cursor:pointer}
.ci-info h3:hover{color:var(--m700)}
.ci-info .ci-meta{font-size:12px;color:var(--muted);margin-bottom:10px}
.ci-info .ci-meta span{margin-right:12px}
.ci-controls{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.lqty{display:flex;align-items:center;border:1px solid var(--border);border-radius:6px;overflow:hidden}
.lqty button{width:32px;height:32px;font-size:16px;color:var(--m700);border:none;background:#fff;transition:background .1s}
.lqty button:hover{background:var(--cr2)}
.lqty span{min-width:36px;text-align:center;font-family:var(--ui);font-size:13px;font-weight:700;color:var(--ink);border-left:1px solid var(--border);border-right:1px solid var(--border)}
.ci-links{display:flex;gap:12px}
.ci-link{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:none;background:none;cursor:pointer;padding:0;transition:color .12s}
.ci-link.del{color:#c53030}
.ci-link.del:hover{color:#9b2c2c}
.ci-price{font-family:var(--ui);font-size:16px;font-weight:700;color:var(--m900);min-width:90px;text-align:right}
.price-sum{background:#fff;border:1px solid var(--border);border-radius:12px;padding:22px;position:sticky;top:82px}
.price-sum h2{font-family:var(--ui);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--m800);margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.psrow{display:flex;justify-content:space-between;font-size:14px;color:var(--muted);margin-bottom:9px}
.psrow strong{color:var(--ink)}
.psrow.disc strong{color:#276749}
.pstotal{display:flex;justify-content:space-between;font-family:var(--ui);font-size:16px;font-weight:700;color:var(--m900);padding-top:12px;border-top:1px solid var(--border);margin:12px 0 18px}
.savings-msg{font-family:var(--ui);font-size:11px;font-weight:700;color:#276749;background:#c6f6d5;padding:8px 12px;border-radius:8px;text-align:center;margin-bottom:16px}
.secure-icons{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;flex-wrap:wrap}
.secure-icons span{font-family:var(--ui);font-size:10px;color:var(--muted);font-weight:600;letter-spacing:.04em}

/* CHECKOUT */
.copage{max-width:900px;margin:0 auto;padding:32px min(28px,3vw)}
.copage-title{font-family:var(--display);font-size:1.9rem;color:var(--m900);margin-bottom:6px}
.copage-sub{font-family:var(--ui);font-size:11px;color:var(--muted);margin-bottom:28px;letter-spacing:.05em}
.steps{display:flex;align-items:center;margin-bottom:32px;background:#fff;border:1px solid var(--border);border-radius:10px;overflow:hidden}
.step{flex:1;display:flex;align-items:center;gap:8px;padding:13px 16px;font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);border-right:1px solid var(--border);position:relative}
.step:last-child{border-right:none}
.step.act{color:var(--m900);background:var(--cr2)}
.step.done{color:var(--g700)}
.step-num{width:22px;height:22px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.step.act .step-num{background:var(--m700);color:#fff}
.step.done .step-num{background:var(--g600);color:#fff}
.colayout{display:grid;grid-template-columns:1fr 320px;gap:22px;align-items:start}
.cosec{background:#fff;border:1px solid var(--border);border-radius:12px;padding:22px;margin-bottom:18px}
.cosec h2{font-family:var(--ui);font-size:12px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--m800);margin-bottom:18px;padding-bottom:11px;border-bottom:1px solid var(--border)}
.frow2{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:11px}
.fld{display:flex;flex-direction:column;gap:5px;margin-bottom:11px}
.fld label{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.fld input,.fld select,.fld textarea{padding:9px 13px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;color:var(--ink);background:#fff;transition:border-color .14s;outline:none}
.fld input:focus,.fld select:focus,.fld textarea:focus{border-color:var(--m700)}
.fld textarea{resize:vertical;min-height:60px}
.pay-tabs{display:flex;gap:0;border:1.5px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:18px}
.ptab{flex:1;padding:9px 6px;font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);background:#fff;border-right:1px solid var(--border);transition:all .14s;text-align:center;cursor:pointer;border-top:none;border-bottom:none;border-left:none}
.ptab:last-child{border-right:none}
.ptab.act{background:var(--m900);color:var(--g200)}
.upi-apps{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:14px}
.uapp{display:flex;align-items:center;gap:10px;padding:11px 13px;border:1.5px solid var(--border);border-radius:9px;cursor:pointer;transition:all .14s;background:#fff}
.uapp:hover,.uapp.sel{border-color:var(--m700);background:var(--cr2)}
.uapp-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;font-family:var(--ui);flex-shrink:0}
.uapp span{font-family:var(--ui);font-size:12px;font-weight:700;color:var(--m800)}
.upi-input-row{margin-top:4px}
.upi-input-row label{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:6px}
.upi-input-row input{width:100%;padding:9px 13px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none}
.upi-input-row input:focus{border-color:var(--m700)}
.card-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.card-full{grid-column:span 2}
.banksel{width:100%;padding:9px 13px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;color:var(--ink);background:#fff;cursor:pointer;outline:none}
.cod-box{background:var(--cr2);border:1.5px solid var(--border);border-radius:10px;padding:14px;font-size:14px;color:var(--m800)}
.cod-box strong{display:block;font-family:var(--ui);font-size:12px;font-weight:700;letter-spacing:.07em;margin-bottom:5px}
.emi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.emi-opt{border:1.5px solid var(--border);border-radius:8px;padding:10px;cursor:pointer;transition:all .14s;text-align:center;background:#fff}
.emi-opt:hover,.emi-opt.sel{border-color:var(--m700);background:var(--cr2)}
.emi-opt strong{display:block;font-family:var(--ui);font-size:13px;font-weight:700;color:var(--m900)}
.emi-opt small{font-family:var(--ui);font-size:10px;color:var(--muted)}
.ordsum{background:#fff;border:1px solid var(--border);border-radius:12px;padding:20px;position:sticky;top:82px}
.ordsum h2{font-family:var(--ui);font-size:12px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--m800);margin-bottom:18px;padding-bottom:11px;border-bottom:1px solid var(--border)}
.oi{display:grid;grid-template-columns:58px 1fr;gap:9px;margin-bottom:11px;padding-bottom:11px;border-bottom:1px solid var(--border)}
.oi:last-of-type{border-bottom:none}
.oi img{width:58px;height:58px;object-fit:cover;border-radius:7px}
.oi-n{font-size:12px;font-weight:600;color:var(--ink);margin-bottom:2px;line-height:1.3}
.oi-m{font-size:11px;color:var(--muted)}
.oi-p{font-family:var(--ui);font-size:12px;font-weight:700;color:var(--m900)}
.osrow{display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:7px}
.osrow strong{color:var(--ink)}
.osrow.green strong{color:#276749}
.ostotal{display:flex;justify-content:space-between;font-family:var(--ui);font-size:15px;font-weight:700;color:var(--m900);padding-top:10px;border-top:1px solid var(--border);margin:10px 0 16px}

/* PROCESSING */
.processing{text-align:center;padding:40px 20px}
.pspin{width:52px;height:52px;border:4px solid var(--border);border-top-color:var(--m700);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 14px}
@keyframes spin{to{transform:rotate(360deg)}}
.processing h3{font-family:var(--display);font-size:1.4rem;color:var(--m900);margin-bottom:6px}
.processing p{font-family:var(--ui);font-size:12px;color:var(--muted);font-weight:600;letter-spacing:.05em}

/* ORDER SUCCESS */
.sucpage{max-width:540px;margin:70px auto;padding:0 22px;text-align:center}
.suc-icon{width:72px;height:72px;background:#c6f6d5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;font-size:34px}
.sucpage h1{font-family:var(--display);font-size:2rem;color:var(--m900);margin-bottom:10px}
.sucpage p{color:var(--muted);margin-bottom:7px;font-size:1rem}
.oid{font-family:var(--ui);font-size:12px;font-weight:700;letter-spacing:.09em;color:var(--m800);background:var(--cr2);padding:7px 15px;border-radius:6px;display:inline-block;margin:10px 0 26px}
.suc-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.track-info{background:#fff;border:1px solid var(--border);border-radius:12px;padding:18px;margin-top:22px;text-align:left}
.track-info h3{font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--m800);margin-bottom:12px}
.track-row{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border)}
.track-row:last-child{border-bottom:none}
.track-dot{width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0}
.track-row p{font-size:13px;color:var(--ink);font-weight:600;margin-bottom:2px}
.track-row small{font-family:var(--ui);font-size:11px;color:var(--muted)}

/* ADMIN */
.admin-wrap{max-width:1120px;margin:0 auto;padding:32px min(28px,3vw)}
.admin-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:14px}
.admin-header h1{font-family:var(--display);font-size:1.9rem;color:var(--m900)}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:24px}
.scard{background:#fff;border:1px solid var(--border);border-radius:12px;padding:18px;text-align:center}
.scard .snum{font-family:var(--display);font-size:2.2rem;font-weight:700;color:var(--m900);line-height:1}
.scard .slbl{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:6px}
.scard.hl{background:var(--m900)}
.scard.hl .snum{color:var(--g400)}
.scard.hl .slbl{color:var(--g600)}
.scard.new-card{background:linear-gradient(135deg,#fff3cd,#fef9e7);border-color:#f6ad55}
.scard.new-card .snum{color:#c05621}
.orders-wrap{background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.otable-head{display:grid;grid-template-columns:130px 1fr 90px 100px 105px 100px;gap:0;background:var(--cr2);padding:11px 18px;font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.orow{display:grid;grid-template-columns:130px 1fr 90px 100px 105px 100px;gap:0;padding:13px 18px;border-top:1px solid var(--border);align-items:center;cursor:pointer;transition:background .1s}
.orow:hover{background:var(--cr2)}
.orow.new-row{background:#fffbeb}
.or-id{font-family:var(--ui);font-size:11px;font-weight:700;color:var(--m800)}
.or-name{font-size:13px;color:var(--ink)}
.or-items{font-family:var(--ui);font-size:11px;color:var(--muted)}
.or-amt{font-family:var(--ui);font-size:13px;font-weight:700;color:var(--m900)}
.or-pay{font-family:var(--ui);font-size:10px;font-weight:600;color:var(--muted)}
.sbadge{display:inline-block;padding:3px 9px;border-radius:99px;font-family:var(--ui);font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}
.s-new{background:#fef3c7;color:#92400e}
.s-processing{background:#dbeafe;color:#1e40af}
.s-shipped{background:#d1fae5;color:#065f46}
.s-delivered{background:#dcfce7;color:#14532d}
.s-cancelled{background:#fee2e2;color:#991b1b}
.notif-pulse{position:absolute;top:3px;right:3px;width:8px;height:8px;background:#e53e3e;border-radius:50%;border:2px solid var(--cr1);animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.3)}}
.modal-bg{position:fixed;inset:0;background:rgba(36,5,6,.6);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px)}
.modal-box{background:#fff;border-radius:16px;width:min(620px,100%);max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 20px 60px rgba(49,8,8,.22)}
.modal-box h2{font-family:var(--display);font-size:1.5rem;color:var(--m900);margin-bottom:18px;display:flex;align-items:center;justify-content:space-between}
.modal-box h2 button{font-size:22px;color:var(--muted);border:none;background:none;cursor:pointer}
.od-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
.od-f label{font-family:var(--ui);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:3px}
.od-f span{font-size:14px;color:var(--ink);font-weight:500}
.status-sel{width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:var(--ui);font-size:12px;font-weight:700;color:var(--m800);background:#fff;cursor:pointer;outline:none}
.admin-login{max-width:380px;margin:90px auto;padding:0 22px}
.admin-login h1{font-family:var(--display);font-size:2rem;color:var(--m900);text-align:center;margin-bottom:6px}
.admin-login p{text-align:center;color:var(--muted);margin-bottom:28px;font-family:var(--ui);font-size:12px;letter-spacing:.05em}
.lbox{background:#fff;border:1px solid var(--border);border-radius:14px;padding:28px}
.lerr{background:#fee2e2;color:#991b1b;font-family:var(--ui);font-size:11px;font-weight:700;padding:9px 12px;border-radius:7px;margin-bottom:12px;text-align:center}
.notif-toast{position:fixed;bottom:22px;left:22px;background:var(--m900);color:var(--g200);padding:14px 18px;border-radius:12px;font-family:var(--ui);font-size:12px;font-weight:700;z-index:600;box-shadow:0 10px 28px rgba(49,8,8,.3);display:flex;align-items:center;gap:10px;transform:translateY(120px);transition:transform .28s cubic-bezier(.4,0,.2,1);letter-spacing:.04em}
.notif-toast.show{transform:translateY(0)}
.notif-toast .nt-icon{font-size:20px}
.toast{position:fixed;bottom:22px;right:22px;background:var(--m900);color:var(--g200);padding:11px 18px;border-radius:9px;font-family:var(--ui);font-size:12px;font-weight:700;z-index:700;box-shadow:0 7px 22px rgba(49,8,8,.25);transform:translateY(18px);opacity:0;transition:all .22s;pointer-events:none;letter-spacing:.04em}
.toast.show{transform:translateY(0);opacity:1}

/* RESPONSIVE */
@media(max-width:1040px){
  .dnav{display:none}
  .mtoggle{display:flex}
  .hdr-inner{grid-template-columns:auto auto auto}
  .playout{grid-template-columns:1fr}
  .filters{position:static}
  .dlayout{grid-template-columns:1fr}
  .gallery{grid-template-columns:58px 1fr}
  .thumbs{flex-direction:row;overflow-x:auto}
  .tbtn img{width:58px;height:58px}
  .sgrid{grid-template-columns:1fr 1fr;padding:0 14px}
  .scard--wide{grid-column:span 2}
  .colayout{grid-template-columns:1fr}
  .ordsum,.price-sum{position:static}
  .cart-layout{grid-template-columns:1fr}
  .fgrid{grid-template-columns:1fr 1fr}
  .nl{grid-template-columns:1fr}
}
@media(max-width:640px){
  .oband{grid-template-columns:1fr}
  .oband article{border-right:none;border-bottom:1px solid rgba(255,250,240,.1)}
  .sgrid{grid-template-columns:1fr;padding:0 12px}
  .scard--wide{grid-column:auto}
  .scard--wide,.scard{min-height:150px}
  .rev-grid{grid-template-columns:1fr}
  .nlf{flex-direction:column}
  .fgrid{grid-template-columns:1fr}
  .otable-head,.orow{grid-template-columns:100px 1fr 80px 90px;font-size:11px}
  .otable-head>:nth-child(5),.orow .or-pay,.otable-head>:nth-child(6){display:none}
  .hero-c h1{font-size:1.8rem}
  .frow2{grid-template-columns:1fr}
  .card-grid{grid-template-columns:1fr}
  .card-full{grid-column:span 1}
  .emi-grid{grid-template-columns:1fr 1fr}
  .stats-grid{grid-template-columns:1fr 1fr}
  .copage-title{font-size:1.5rem}
  .steps{flex-wrap:wrap}
  .step{padding:9px 11px;font-size:9px}
  .od-grid{grid-template-columns:1fr}
  .ci{grid-template-columns:80px 1fr}
  .ci>:last-child{grid-column:span 2;text-align:left}
  .upi-apps{grid-template-columns:1fr 1fr}
}
`;

// ═══════════════════════ HELPER COMPONENTS ══════════════════════════════════

function Stars({ rating }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{color: i <= Math.floor(rating) ? "#f6ad55" : i - rating < 1 && i > Math.floor(rating) ? "#f6ad55" : "#e2e8f0"}}>★</span>
      ))}
    </span>
  );
}

function Toast({ msg }) {
  return <div className={`toast${msg ? " show" : ""}`}>{msg}</div>;
}

function AnnouncementBar() {
  const items = ["BUY 2 @15% OFF","BUY 3 @20% OFF","BUY 4 @25% OFF","FREE DELIVERY ON PREPAID ORDERS","EASY 7-DAY RETURNS","AUTHENTIC SILK SAREES"];
  return (
    <div className="ann">
      <div className="ann-track">
        {[...items,...items].map((t,i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ navigate, cartCount, onCartOpen, onSearch, onMenu, newOrders, onSecretClick, authUser, onAuthOpen, onSignOut }) {
  const [up, setUp] = useState(false);
  useEffect(()=>{
    const h=()=>setUp(window.scrollY>8);
    window.addEventListener("scroll",h,{passive:true});
    return ()=>window.removeEventListener("scroll",h);
  },[]);
  return (
    <header className={`hdr${up?" up":""}`}>
      <div className="hdr-inner">
        <button className="mtoggle" onClick={onMenu} aria-label="Menu"><span/><span/><span/></button>
        <div className="brand" onClick={()=>{navigate("home");if(onSecretClick)onSecretClick();}}>
          <img src="./assets/logo.jpg" alt="LABEL-SANJ Logo" style={{width:46,height:46,objectFit:"contain",borderRadius:8,flexShrink:0}}/>
          <span>
            <strong style={{fontStyle:"italic",letterSpacing:".04em"}}>Label-Sanj</strong>
            <small>Premium Silk Sarees</small>
          </span>
        </div>
        <nav className="dnav">
          <a onClick={()=>navigate("products",{collection:"festive"})}>Festive Sale</a>
          <a onClick={()=>navigate("products",{collection:"new"})}>New Arrivals</a>
          <a onClick={()=>navigate("products",{collection:"trending"})}>Trending</a>
          <div className="ndrop">
            <span>Weaving ▾</span>
            <div className="ddrop">
              {["brocade","kanjivaram","contrast","zari-butti","contrast-pallu","traditional-mysore-silks"].map(c=>(
                <a key={c} onClick={()=>navigate("products",{collection:c})}>{COLLECTIONS[c]?.[0]||c}</a>
              ))}
            </div>
          </div>
          <div className="ndrop">
            <span>Printed ▾</span>
            <div className="ddrop">
              {["hand-painted","modern-print","kalamkari","flowers","pallu-prints"].map(c=>(
                <a key={c} onClick={()=>navigate("products",{collection:c})}>{COLLECTIONS[c]?.[0]||c}</a>
              ))}
            </div>
          </div>
          <a onClick={()=>navigate("products",{collection:"dresses"})}>Trendy Dresses</a>
          <a onClick={()=>navigate("products",{collection:"silk-borderline"})}>Silk Borderline</a>
        </nav>
        <div className="hact">
          <button className="ibtn" onClick={onSearch} aria-label="Search">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          {/* Sign In / User button */}
          {authUser ? (
            <button className="ibtn" onClick={onSignOut} aria-label="Sign Out" title={`Signed in as ${authUser.displayName||authUser.phoneNumber||authUser.email||"you"} · Click to sign out`} style={{position:"relative"}}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <span style={{position:"absolute",top:2,right:2,width:7,height:7,borderRadius:"50%",background:"#16a34a",border:"1.5px solid #fff"}}/>
            </button>
          ) : (
            <button className="ibtn" onClick={onAuthOpen} aria-label="Sign In" title="Sign in">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </button>
          )}
          <button className="ibtn" onClick={onCartOpen} aria-label="Cart">
            <svg viewBox="0 0 24 24"><path d="M6.5 8.5h11l-.8 10.2a2 2 0 0 1-2 1.8H9.3a2 2 0 0 1-2-1.8L6.5 8.5Zm2.5 0V7a3 3 0 1 1 6 0v1.5"/></svg>
            {cartCount>0 && <span className="cbadge">{cartCount}</span>}
          </button>
          <button className="ibtn" onClick={()=>navigate("admin")} aria-label="Admin Panel" title="Admin Panel" style={{position:"relative"}}>
            <svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
            {newOrders>0 && <span className="nbadge">{newOrders}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── MOBILE MENU ─────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose, navigate }) {
  const go=(p,d={})=>{ navigate(p,d); onClose(); };
  return (
    <aside className={`mmenu${open?" open":""}`}>
      <div className="mmhead">
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src="./assets/logo.jpg" alt="" style={{width:34,height:34,objectFit:"contain",borderRadius:6}}/>
          <strong>Label-Sanj</strong>
        </div>
        <button onClick={onClose}>✕</button>
      </div>
      <a onClick={()=>go("products",{collection:"festive"})}>Festive Sale</a>
      <a onClick={()=>go("products",{collection:"new"})}>New Arrivals</a>
      <a onClick={()=>go("products",{collection:"trending"})}>Trending</a>
      <details className="mdet" open>
        <summary>Weaving ▾</summary>
        {["brocade","kanjivaram","contrast","zari-butti","contrast-pallu","traditional-mysore-silks"].map(c=>(
          <a key={c} onClick={()=>go("products",{collection:c})}>{COLLECTIONS[c]?.[0]||c}</a>
        ))}
      </details>
      <details className="mdet">
        <summary>Printed ▾</summary>
        {["hand-painted","modern-print","kalamkari","flowers","pallu-prints"].map(c=>(
          <a key={c} onClick={()=>go("products",{collection:c})}>{COLLECTIONS[c]?.[0]||c}</a>
        ))}
      </details>
      <a onClick={()=>go("products",{collection:"dresses"})}>Trendy Dresses</a>
      <a onClick={()=>go("products",{collection:"silk-borderline"})}>Silk Borderline</a>
    </aside>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, navigate, onAddToCart }) {
  const sv = Math.round((product.original-product.price)/product.original*100);
  return (
    <article className="pcard">
      <div className="pcard-media" onClick={()=>navigate("detail",{id:product.id})}>
        <span className="pcbadge">{product.badge}</span>
        <img src={product.images[0]} alt={product.name} loading="lazy" />
        <button className="wishlist-btn" onClick={e=>e.stopPropagation()} title="Wishlist">♡</button>
      </div>
      <div className="pcard-body">
        <span className="pcard-title" onClick={()=>navigate("detail",{id:product.id})}>{product.name}</span>
        <div className="pcard-rating">
          <Stars rating={product.rating}/>
          <span className="rcount">({product.reviews})</span>
        </div>
        <div className="price-row">
          <span className="sale-price">{fmt(product.price)}</span>
          <span className="og-price">{fmt(product.original)}</span>
          <span className="save-tag">{sv}% off</span>
        </div>
        <div className="pcard-actions" style={{marginTop:10}}>
          <button className="btn btn-outline btn-sm" onClick={()=>onAddToCart(product.id,product.colors[0],1)}>Add to Cart</button>
          <button className="btn btn-gold btn-sm" onClick={()=>navigate("detail",{id:product.id})}>Buy Now</button>
        </div>
      </div>
    </article>
  );
}

// ─── CART DRAWER ─────────────────────────────────────────────────────────────
function CartDrawer({ open, onClose, cart, updateQty, removeItem, navigate }) {
  const products = useContext(ProductsCtx);
  const t = cartTotals(cart, products);
  const items = cart.map(i=>({...i,p:products.find(x=>x.id===i.id)})).filter(i=>i.p);
  return (
    <aside className={`cdrawer${open?" open":""}`}>
      <div className="dhead">
        <h2>Shopping Cart {t.count>0&&<span style={{fontSize:"1rem",color:"var(--g400)"}}>({t.count})</span>}</h2>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="citems">
        {!items.length ? (
          <div style={{textAlign:"center",padding:"50px 20px"}}>
            <div style={{fontSize:48,marginBottom:12}}>🛒</div>
            <p className="cempty">Your cart is empty</p>
            <button className="btn btn-gold" style={{marginTop:16}} onClick={()=>{onClose();navigate("products",{collection:"new"})}}>Start Shopping</button>
          </div>
        ) : items.map(({p,color,qty})=>(
          <article className="citem" key={p.id+color}>
            <img src={p.images[0]} alt={p.name} onClick={()=>{onClose();navigate("detail",{id:p.id})}} style={{cursor:"pointer"}} />
            <div>
              <h3>{p.name}</h3>
              <p>{color} · {fmt(p.price)} each</p>
              <div className="citem-row">
                <div className="mqty">
                  <button onClick={()=>updateQty(p.id,color,-1)}>−</button>
                  <span>{qty}</span>
                  <button onClick={()=>updateQty(p.id,color,1)}>+</button>
                </div>
                <button className="rmbtn" onClick={()=>removeItem(p.id,color)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {items.length>0&&(
        <div className="csumm">
          {t.disc>0&&<div className="binfo">🎉 You saved {fmt(t.disc)} with bundle discount!</div>}
          <div className="csrow"><span>Subtotal ({t.count} items)</span><strong>{fmt(t.sub)}</strong></div>
          {t.disc>0&&<div className="csrow" style={{color:"#276749"}}><span>Bundle Discount</span><strong>−{fmt(t.disc)}</strong></div>}
          <div className="csrow"><span>Delivery</span><strong style={{color:t.ship===0?"#276749":"inherit"}}>{t.ship===0?"FREE":fmt(t.ship)}</strong></div>
          <div className="ctrow"><span>Total</span><span>{fmt(t.total)}</span></div>
          <div className="cdrawer-actions">
            <button className="btn btn-gold btn-full btn-lg" onClick={()=>{onClose();navigate("cart")}}>View Cart</button>
            <button className="btn btn-dark btn-full" onClick={()=>{onClose();navigate("checkout")}}>Checkout →</button>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── SEARCH MODAL ─────────────────────────────────────────────────────────────
function SearchModal({ open, onClose, navigate }) {
  const products = useContext(ProductsCtx);
  const [q,setQ]=useState("");
  const res = products.filter(p=>{
    const t=`${p.name} ${p.fabric} ${(p.tags||[]).join(" ")}`.toLowerCase();
    return !q.trim()||t.includes(q.toLowerCase());
  }).slice(0,6);
  return (
    <div className={`smodal${open?" open":""}`} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sbox">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2>Search Sarees</h2>
          <button onClick={onClose} style={{fontSize:20,color:"var(--muted)",border:"none",background:"none",cursor:"pointer"}}>✕</button>
        </div>
        <input className="sinput" placeholder="Search for silk sarees, brocade, zari…" value={q} onChange={e=>setQ(e.target.value)} autoFocus={open} />
        <div style={{marginTop:10}}>
          {res.map(p=>(
            <div className="sresult" key={p.id} onClick={()=>{navigate("detail",{id:p.id});onClose();setQ("")}}>
              <img src={p.images[0]} alt={p.name} />
              <span><strong>{p.name}</strong><small>{fmt(p.price)} · {p.fabric}</small></span>
              <button className="btn btn-outline btn-sm">View</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── WHATSAPP FLOAT ──────────────────────────────────────────────────────────
function WhatsAppFloat() {
  const WA_NUMBER = "919999999999"; // ← Change to your WhatsApp number (91 + 10-digit)
  const WA_MSG = "Hi Label-Sanj! I am interested in your saree collection.";
  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MSG)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{
        position:"fixed",bottom:24,right:24,zIndex:190,
        width:58,height:58,borderRadius:"50%",
        background:"#25d366",display:"flex",alignItems:"center",
        justifyContent:"center",
        boxShadow:"0 6px 22px rgba(37,211,102,.45)",
        transition:"transform .18s,box-shadow .18s",border:"none",
        textDecoration:"none"
      }}
      onMouseOver={e=>{e.currentTarget.style.transform="scale(1.12)";e.currentTarget.style.boxShadow="0 10px 32px rgba(37,211,102,.55)";}}
      onMouseOut={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 6px 22px rgba(37,211,102,.45)";}}
      title="Chat on WhatsApp"
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    </a>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="fgrid">
        <div>
          <div className="brand" style={{marginBottom:12}} onClick={()=>navigate("home")}>
            <img src="./assets/logo.jpg" alt="Label-Sanj" style={{width:38,height:38,objectFit:"contain",borderRadius:7,flexShrink:0}}/>
            <span><strong style={{color:"var(--g200)",fontStyle:"italic"}}>Label-Sanj</strong><small style={{color:"var(--g400)"}}>Premium Silk Sarees</small></span>
          </div>
          <p>Celebrating Indian weaving heritage with graceful silk sarees, occasionwear, and everyday festive pieces.</p>
          <div className="socials" style={{marginTop:14}}>
            <a href="#">IG</a><a href="#">FB</a><a href="#">PT</a>
          </div>
        </div>
        <div>
          <h3>Shop</h3>
          <a onClick={()=>navigate("products",{collection:"new"})}>New Arrivals</a>
          <a onClick={()=>navigate("products",{collection:"trending"})}>Trending</a>
          <a onClick={()=>navigate("products",{collection:"festive"})}>Festive Sale</a>
          <a onClick={()=>navigate("products",{collection:"printed"})}>Printed Sarees</a>
        </div>
        <div>
          <h3>Help</h3>
          <a href="#">Shipping Policy</a>
          <a href="#">Return Policy</a>
          <a href="#">Size Guide</a>
          <a href="#">Contact Us</a>
        </div>
        <div>
          <h3>Contact</h3>
          <p>12 Silk Weavers Lane, Karnataka, India</p>
          <p>care@zenithsui.com</p>
          <p>+91 98765 43210</p>
          <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}>
            {["Paytm","PhonePe","UPI","Visa","Mastercard","RuPay"].map(b=>(
              <span key={b} style={{background:"rgba(227,198,103,.15)",color:"var(--g400)",fontFamily:"var(--ui)",fontSize:9,fontWeight:700,padding:"3px 6px",borderRadius:4,letterSpacing:".05em"}}>{b}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="fbot">© 2026 Label-Sanj. All rights reserved. | Authentic Indian Silk Sarees</div>
    </footer>
  );
}

// ═══════════════════════ PAGES ═══════════════════════════════════════════════

function HomePage({ navigate, onAddToCart }) {
  const products = useContext(ProductsCtx);
  const trending = products.filter(p=>(p.tags||[]).includes("trending")).slice(0,4);
  return (
    <>
      <section className="hero">
        <img src="https://images.unsplash.com/photo-1641699862936-3626f6fd264c?auto=format&fit=crop&w=1800&q=85" alt="Silk Saree" />
        <div className="hero-shade"/>
        <div className="hero-c">
          <p className="eyebrow">Trend This Week</p>
          <h1>Regal silk sarees for every celebration</h1>
          <p>Handpicked brocades, zari borders, contrast pallus, and printed silks in deep festive tones.</p>
          <div className="hero-btns">
            <button className="btn btn-gold btn-lg" onClick={()=>navigate("products",{collection:"trending"})}>Shop Trending</button>
            <button className="btn btn-ghost btn-lg" onClick={()=>navigate("products",{collection:"new"})}>New Arrivals</button>
          </div>
        </div>
      </section>

      <section className="sec sec--cream">
        <div className="sec-inner">
          <div className="sec-head">
            <p className="eyebrow">Curated For You</p>
            <h2>Trend This Week</h2>
            <p>Fresh occasion-ready sarees with rich color, soft drape, and dramatic pallu details.</p>
          </div>
          <div className="pgrid">
            {trending.map(p=><ProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart}/>)}
          </div>
          <div style={{textAlign:"center",marginTop:28}}>
            <button className="btn btn-outline btn-lg" onClick={()=>navigate("products",{collection:"new"})}>View All Products →</button>
          </div>
        </div>
      </section>


      {/* FEATURE STRIP */}
      <div className="fstrip">
        {[
          ["🚚","Free Shipping","On all prepaid orders above ₹999"],
          ["↩","7-Day Returns","Hassle-free return policy"],
          ["✦","100% Authentic","Genuine handpicked silk"],
          ["💬","WhatsApp Support","Chat with us anytime"],
        ].map(([icon,title,sub])=>(
          <div className="fstrip-item" key={title}>
            <span className="fstrip-icon">{icon}</span>
            <div><h4>{title}</h4><p>{sub}</p></div>
          </div>
        ))}
      </div>

      <section className="oband">
        {[["Buy 2","Get 15% OFF","festive"],["Buy 3","Get 20% OFF","trending"],["Buy 4","Get 25% OFF","new"]].map(([q,l,c])=>(
          <article key={q}>
            <span>{q}</span><h3>{l}</h3>
            <a onClick={()=>navigate("products",{collection:c})}>Shop Now</a>
          </article>
        ))}
      </section>

      <section className="sec">
        <div className="sec-head" style={{maxWidth:"var(--max)",margin:"0 auto 40px",padding:"0 min(40px,4vw)"}}>
          <p className="eyebrow">Collection Highlights</p>
          <h2>Craft stories in silk</h2>
          <p>Signature weaves, painterly prints, and statement borders built for repeat wearing.</p>
        </div>
        <div className="sgrid">
          {[
            ["scard scard--wide","https://images.unsplash.com/photo-1630443357238-d4e235563745?auto=format&fit=crop&w=1200&q=85","Brocade","Opulent motifs with a festive glow","brocade"],
            ["scard","https://images.unsplash.com/photo-1669192324363-1ae5412cce34?auto=format&fit=crop&w=900&q=85","Printed","Modern florals and artful pallus","printed"],
            ["scard","https://images.unsplash.com/photo-1610209843753-b7bd6c6ec1e2?auto=format&fit=crop&w=900&q=85","Kanjivaram","Temple borders and luminous zari","kanjivaram"],
          ].map(([cls,img,tag,sub,col])=>(
            <div key={col} className={cls} onClick={()=>navigate("products",{collection:col})}>
              <img src={img} alt={tag}/>
              <span>{tag}</span>
              <strong>{sub}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rev-sec">
        <div className="sec-head sec-head-dark">
          <p className="eyebrow">Loved By Customers</p>
          <h2 style={{color:"var(--g200)"}}>Customer Reviews</h2>
        </div>
        <div className="rev-grid">
          {[
            ["The saree arrived beautifully packed and looked even richer in person. The color was perfect for the ceremony.","Aishwarya R.","★★★★★"],
            ["Label-Sanj has become my first stop for festive gifting. Smooth drape, quick delivery, and easy shopping.","Meera S.","★★★★★"],
            ["The contrast pallu collection feels premium without being heavy. I ordered two more for family events.","Kavya M.","★★★★☆"],
          ].map(([q,by,s])=>(
            <figure key={by}>
              <div style={{color:"#f6ad55",fontSize:14,marginBottom:8}}>{s}</div>
              <blockquote>{q}</blockquote>
              <figcaption>— {by}</figcaption>
            </figure>
          ))}
        </div>
      </section>


      {/* BRAND STORY */}
      <section className="sec" style={{background:"var(--cr2)",padding:0}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",maxWidth:"var(--max)",margin:"0 auto"}}>
          <div style={{overflow:"hidden",minHeight:400}}>
            <img
              src="https://images.unsplash.com/photo-1549417229-aa67d3263c4f?auto=format&fit=crop&w=900&q=85"
              alt="Our Story"
              style={{width:"100%",height:"100%",objectFit:"cover",minHeight:400}}
            />
          </div>
          <div style={{padding:"56px 48px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <p className="eyebrow">Our Heritage</p>
            <h2 style={{fontFamily:"var(--display)",fontSize:"clamp(1.7rem,2.8vw,2.4rem)",fontWeight:700,color:"var(--m900)",margin:"10px 0 18px",lineHeight:1.15,fontStyle:"italic"}}>
              Woven with Love, Designed for Every Celebration
            </h2>
            <p style={{color:"var(--muted)",fontSize:15,lineHeight:1.8,marginBottom:12}}>
              Label-Sanj was born from a deep love for India's textile heritage. We believe every woman deserves to feel extraordinary — whether it's a wedding, a festival, or a quiet family gathering.
            </p>
            <p style={{color:"var(--muted)",fontSize:15,lineHeight:1.8,marginBottom:18}}>
              Every saree is handpicked by us, ensuring authentic fabric, exceptional drape, and that timeless feeling of wearing something truly special.
            </p>
            <div style={{fontFamily:"var(--display)",fontSize:"1.3rem",color:"var(--m700)",fontStyle:"italic",marginBottom:22}}>
              — With love, Label-Sanj
            </div>
            <button className="btn btn-outline btn-lg" style={{alignSelf:"flex-start"}} onClick={()=>navigate("products",{collection:"new"})}>
              Explore Collection →
            </button>
          </div>
        </div>
      </section>


      {/* INSTAGRAM SECTION */}
      <section className="sec" style={{paddingBottom:8}}>
        <div className="sec-head">
          <p className="eyebrow">Follow Along</p>
          <h2>@label.sanj on Instagram</h2>
          <p>Tag us in your looks for a chance to be featured on our page.</p>
        </div>
      </section>
      <div className="insta-grid">
        {[
          "https://images.unsplash.com/photo-1532664189809-e02133fee698?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1641699862936-3626f6fd264c?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1669192324363-1ae5412cce34?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1610209843753-b7bd6c6ec1e2?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1631137826736-a803bd2f79a0?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1732544893739-cf939e0ae81d?auto=format&fit=crop&w=400&q=80",
        ].map((src,i)=>(
          <a key={i} className="insta-item" href="https://www.instagram.com/label.sanj" target="_blank" rel="noopener noreferrer">
            <img src={src} alt={`Style ${i+1}`} loading="lazy"/>
            <div className="insta-overlay"><span>📸 View</span></div>
          </a>
        ))}
      </div>

      <section className="nl">
        <div>
          <p className="eyebrow">Extra Savings</p>
          <h2>Join the Label-Sanj circle</h2>
          <p>Get new drops, festive sale alerts, and styling edits first.</p>
        </div>
        <div className="nlf">
          <input placeholder="Your email address" type="email"/>
          <button className="btn btn-dark">Subscribe</button>
        </div>
      </section>
    </>
  );
}

// ─── PRODUCTS PAGE ───────────────────────────────────────────────────────────
function ProductsPage({ navigate, pageData, onAddToCart }) {
  const products = useContext(ProductsCtx);
  const collection = pageData?.collection || "new";
  const [active, setActive] = useState([collection]);
  const [sort, setSort] = useState("featured");
  const FILTERS = [
    {label:"New Arrivals",val:"new"},{label:"Trending",val:"trending"},
    {label:"Festive Sale",val:"festive"},{label:"Brocade",val:"brocade"},
    {label:"Kanjivaram",val:"kanjivaram"},{label:"Contrast Pallu",val:"contrast-pallu"},
    {label:"Printed",val:"printed"},{label:"Kalamkari",val:"kalamkari"},
    {label:"Hand Painted",val:"hand-painted"},{label:"Dresses",val:"dresses"},
  ];
  useEffect(()=>{ setActive([collection]); },[collection]);
  const toggle = v => setActive(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  let items = products.filter(p=>!active.length||active.some(a=>(p.tags||[]).includes(a)));
  if(sort==="price-low") items=[...items].sort((a,b)=>a.price-b.price);
  if(sort==="price-high") items=[...items].sort((a,b)=>b.price-a.price);
  if(sort==="rating") items=[...items].sort((a,b)=>b.rating-a.rating);
  if(sort==="name") items=[...items].sort((a,b)=>a.name.localeCompare(b.name));
  const cInfo = COLLECTIONS[collection]||["All Products","Browse our complete collection."];
  return (
    <div className="ppage">
      <div className="playout">
        <aside className="filters">
          <div className="fhead">
            <h3>Filters</h3>
            <button className="clearbtn" onClick={()=>setActive([])}>Clear all</button>
          </div>
          <div className="filter-group">
            <h4>Collections</h4>
            {FILTERS.map(f=>(
              <label key={f.val}>
                <input type="checkbox" checked={active.includes(f.val)} onChange={()=>toggle(f.val)}/>
                {f.label}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h4>Price Range</h4>
            {[["Under ₹1,000","u1000"],["₹1,000–₹1,500","1000-1500"],["Above ₹1,500","a1500"]].map(([l,v])=>(
              <label key={v}><input type="checkbox"/>{l}</label>
            ))}
          </div>
        </aside>
        <div>
          <div className="collhead">
            <h1>{cInfo[0]}</h1>
            <p>{cInfo[1]}</p>
          </div>
          <div className="collmeta">
            <span className="collcount">{items.length} products</span>
            <select className="sortsel" value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>
          {items.length ? (
            <div className="pgrid">
              {items.map(p=><ProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart}/>)}
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"60px 20px",color:"var(--muted)"}}>
              <div style={{fontSize:40,marginBottom:12}}>🔍</div>
              <p style={{fontFamily:"var(--ui)",fontSize:14,fontWeight:600}}>No products found for this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL PAGE ─────────────────────────────────────────────────────
function DetailPage({ navigate, pageData, onAddToCart }) {
  const products = useContext(ProductsCtx);
  const product = products.find(p=>p.id===pageData?.id)||products[0];
  const [img, setImg] = useState(0);
  const [color, setColor] = useState(product?.colors?.[0]||"");
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState("");
  const [delMsg, setDelMsg] = useState("");
  const sv = product ? Math.round((product.original-product.price)/product.original*100) : 0;
  const related = products.filter(p=>p.id!==product?.id).slice(0,4);
  const checkPin = () => {
    if(pin.length===6) setDelMsg(`✓ Delivery available by ${new Date(Date.now()+259200000).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}`);
  };
  useEffect(()=>{ setImg(0); setColor(product.colors[0]); setQty(1); setDelMsg(""); },[product.id]);
  return (
    <>
      <div className="breadcrumb">
        <a onClick={()=>navigate("home")}>Home</a> ›
        <a onClick={()=>navigate("products",{collection:"new"})}>Sarees</a> ›
        <span style={{color:"var(--ink)"}}>{product.name}</span>
      </div>
      <div className="dpage">
        <div className="dlayout">
          <div className="gallery">
            <div className="thumbs">
              {product.images.map((src,i)=>(
                <button key={i} className={`tbtn${img===i?" act":""}`} onClick={()=>setImg(i)}>
                  <img src={src} alt={`View ${i+1}`}/>
                </button>
              ))}
            </div>
            <div className="mimg"><img src={product.images[img]} alt={product.name}/></div>
          </div>
          <div className="dinfo">
            <p className="eyebrow">{product.fabric}</p>
            <h1>{product.name}</h1>
            <div className="drating">
              <span className="sbox2">{product.rating} ★</span>
              <span className="rtext">{product.reviews} ratings · {product.reviews*3} reviews</span>
            </div>
            <div className="dprice">
              <span className="sp">{fmt(product.price)}</span>
              <span className="op">{fmt(product.original)}</span>
              <span className="sv">{sv}% Off</span>
            </div>
            <p style={{fontFamily:"var(--ui)",fontSize:11,color:"#276749",fontWeight:700,marginBottom:12}}>Inclusive of all taxes. FREE delivery on prepaid orders.</p>
            <p className="ddesc">{product.description}</p>
            <div className="vgroup">
              <label>Colour: <strong style={{color:"var(--m800)"}}>{color}</strong></label>
              <div className="swatches">
                {product.colors.map(c=>(
                  <button key={c} className={`swatch${color===c?" act":""}`} onClick={()=>setColor(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="qty-wrap">
              <label>Quantity</label>
              <div className="qstep">
                <button onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                <input type="number" value={qty} min="1" onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))}/>
                <button onClick={()=>setQty(q=>q+1)}>+</button>
              </div>
            </div>
            <div className="dactions">
              <button className="btn btn-gold btn-full btn-lg" onClick={()=>{onAddToCart(product.id,color,qty);navigate("checkout")}}>
                ⚡ Buy Now
              </button>
              <button className="btn btn-outline btn-full btn-lg" onClick={()=>onAddToCart(product.id,color,qty)}>
                🛒 Add to Cart
              </button>
            </div>
            <div className="delinfo">
              <label>Check Delivery Availability</label>
              <div className="delinfo-row">
                <input placeholder="Enter 6-digit pincode" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,6))} maxLength={6}/>
                <button className="btn btn-outline btn-sm" onClick={checkPin}>Check</button>
              </div>
              {delMsg&&<p className="del-result">{delMsg}</p>}
            </div>
            <div className="perks">
              <span>Authentic handpicked silk fabric</span>
              <span>Free delivery on prepaid orders</span>
              <span>Easy 7-day return window</span>
              <span>Buy more save more — up to 25% off</span>
              <span>100% secure Indian payment methods</span>
            </div>
          </div>
        </div>
        {related.length>0&&(
          <section className="sec sec--cream" style={{marginTop:48,borderRadius:12,padding:"40px 32px"}}>
            <div className="sec-head"><h2>You May Also Like</h2></div>
            <div className="pgrid">
              {related.map(p=><ProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart}/>)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// ─── CART PAGE ───────────────────────────────────────────────────────────────
function CartPage({ navigate, cart, updateQty, removeItem }) {
  const products = useContext(ProductsCtx);
  const t = cartTotals(cart, products);
  const items = cart.map(i=>({...i,p:products.find(x=>x.id===i.id)})).filter(i=>i.p);
  if(!items.length) return (
    <div style={{textAlign:"center",padding:"80px 20px"}}>
      <div style={{fontSize:56,marginBottom:16}}>🛒</div>
      <h2 style={{fontFamily:"var(--display)",fontSize:"1.8rem",color:"var(--m900)",marginBottom:8}}>Your cart is empty</h2>
      <p style={{color:"var(--muted)",marginBottom:24}}>Looks like you haven't added anything yet.</p>
      <button className="btn btn-gold btn-lg" onClick={()=>navigate("products",{collection:"new"})}>Start Shopping</button>
    </div>
  );
  return (
    <div className="cartpage">
      <h1>Shopping Cart <span style={{fontFamily:"var(--ui)",fontSize:"1rem",color:"var(--muted)",fontWeight:400}}>({t.count} items)</span></h1>
      <div className="cart-layout">
        <div>
          <div className="cart-items-list">
            <div className="ci-head">Your Items</div>
            {items.map(({p,color,qty})=>(
              <div className="ci" key={p.id+color}>
                <img src={p.images[0]} alt={p.name} onClick={()=>navigate("detail",{id:p.id})}/>
                <div className="ci-info">
                  <h3 onClick={()=>navigate("detail",{id:p.id})}>{p.name}</h3>
                  <div className="ci-meta">
                    <span>Color: {color}</span>
                    <span>Fabric: {p.fabric}</span>
                  </div>
                  <div style={{color:"#276749",fontFamily:"var(--ui)",fontSize:11,fontWeight:700,marginBottom:10}}>In Stock · Free Delivery on Prepaid</div>
                  <div className="ci-controls">
                    <div className="lqty">
                      <button onClick={()=>updateQty(p.id,color,-1)}>−</button>
                      <span>{qty}</span>
                      <button onClick={()=>updateQty(p.id,color,1)}>+</button>
                    </div>
                    <div className="ci-links">
                      <button className="ci-link del" onClick={()=>removeItem(p.id,color)}>Delete</button>
                      <button className="ci-link" style={{color:"var(--m700)"}} onClick={()=>navigate("detail",{id:p.id})}>Save for Later</button>
                    </div>
                  </div>
                </div>
                <div className="ci-price">
                  <div style={{fontFamily:"var(--ui)",fontSize:17,fontWeight:700,color:"var(--m900)"}}>{fmt(p.price*qty)}</div>
                  {qty>1&&<div style={{fontFamily:"var(--ui)",fontSize:11,color:"var(--muted)"}}>{fmt(p.price)} each</div>}
                  <div style={{color:"var(--muted)",fontSize:12,textDecoration:"line-through",marginTop:3}}>{fmt(p.original*qty)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="price-sum">
          <h2>Price Details</h2>
          <div className="psrow"><span>Price ({t.count} items)</span><strong>{fmt(t.sub)}</strong></div>
          {t.disc>0&&<div className="psrow disc"><span>Bundle Discount</span><strong>−{fmt(t.disc)}</strong></div>}
          <div className="psrow"><span>Delivery Charges</span><strong style={{color:t.ship===0?"#276749":"inherit"}}>{t.ship===0?"FREE":fmt(t.ship)}</strong></div>
          <div className="pstotal"><span>Total Amount</span><span>{fmt(t.total)}</span></div>
          {t.disc>0&&<div className="savings-msg">🎉 You will save {fmt(t.disc)} on this order!</div>}
          <button className="btn btn-gold btn-full btn-lg" onClick={()=>navigate("checkout")}>Place Order →</button>
          <div className="secure-icons" style={{marginTop:14}}>
            <span>🔒 100% Secure Payments</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",marginTop:10}}>
            {["Paytm","PhonePe","GPay","BHIM","Visa","MC","RuPay","UPI","COD"].map(b=>(
              <span key={b} style={{background:"var(--cr2)",color:"var(--m800)",fontFamily:"var(--ui)",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,letterSpacing:".04em",border:"1px solid var(--border)"}}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT PAGE ───────────────────────────────────────────────────────────
const EMPTY_ADDR = { name:"", phone:"", email:"", pincode:"", address:"", city:"", state:"", landmark:"" };

const UPI_APPS = [
  { id:"paytm", name:"Paytm", bg:"#00baf2", color:"#fff", letter:"P" },
  { id:"phonepe", name:"PhonePe", bg:"#5f259f", color:"#fff", letter:"PP" },
  { id:"gpay", name:"Google Pay", bg:"#4285f4", color:"#fff", letter:"G" },
  { id:"bhim", name:"BHIM UPI", bg:"#007dc3", color:"#fff", letter:"B" },
  { id:"amazon", name:"Amazon Pay", bg:"#ff9900", color:"#131921", letter:"A" },
  { id:"cred", name:"CRED Pay", bg:"#1a1a2e", color:"#fff", letter:"C" },
  { id:"airtel", name:"Airtel Pay", bg:"#e40000", color:"#fff", letter:"AT" },
  { id:"other", name:"Other UPI", bg:"var(--cr3)", color:"var(--m900)", letter:"+" },
];

function CheckoutPage({ navigate, cart, clearCart, showToast, authUser, onAuthOpen }) {
  const products = useContext(ProductsCtx);
  const [step, setStep] = useState(1);
  // Pre-fill from Firebase user if signed in
  const [addr, setAddr] = useState(() => {
    if (authUser) {
      return {
        ...EMPTY_ADDR,
        name: authUser.displayName || "",
        email: authUser.email || "",
        phone: authUser.phoneNumber ? authUser.phoneNumber.replace("+91","") : "",
      };
    }
    return EMPTY_ADDR;
  });
  const [payMethod, setPayMethod] = useState("upi");
  const [upiApp, setUpiApp] = useState("");
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ num:"", name:"", exp:"", cvv:"" });
  const [bank, setBank] = useState("");
  const [emiPlan, setEmiPlan] = useState("");
  const [processing, setProcessing] = useState(false);
  const t = cartTotals(cart, products);
  const items = cart.map(i=>({...i,p:products.find(x=>x.id===i.id)})).filter(i=>i.p);

  if(!items.length) { navigate("home"); return null; }

  const handlePlaceOrder = async () => {
    setProcessing(true);
    const orderId = genId();
    const order = {
      id: orderId, date: today(), timestamp: Date.now(),
      customer: addr,
      items: items.map(({p,color,qty})=>({id:p.id,name:p.name,color,qty,price:p.price,image:p.images[0]})),
      payment: { method:payMethod, upiApp, upiId:payMethod==="upi"?upiId:"", bank:payMethod==="netbanking"?bank:"", emiPlan:payMethod==="emi"?emiPlan:"" },
      subtotal: t.sub, discount: t.disc, shipping: t.ship, total: t.total,
      status: "new"
    };
    await new Promise(r=>setTimeout(r,2200));
    try {
      await addDoc(collection(db, "orders"), order);
    } catch(e){ console.error("Failed to save order to Firestore:", e); }
    clearCart();
    setProcessing(false);
    navigate("success", { order });
  };

  return (
    <div className="copage">
      <h1 className="copage-title">Secure Checkout</h1>
      <p className="copage-sub">🔒 SAFE · TRUSTED · 100% SECURE PAYMENTS</p>
      <div className="steps">
        {[["1","Delivery Address"],["2","Payment"],["3","Review & Pay"]].map(([n,l])=>(
          <div key={n} className={`step${step===+n?" act":""}${step>+n?" done":""}`}>
            <div className="step-num">{step>+n?"✓":n}</div>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <div className="colayout">
        <div>
          {/* STEP 1: ADDRESS */}
          {step===1&&(
            <div className="cosec">
              <h2>📍 Delivery Address</h2>
              {!authUser && onAuthOpen && (
                <div style={{background:"#f8edd7",border:"1.5px solid rgba(122,28,28,.2)",borderRadius:8,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"'Josefin Sans',Arial,sans-serif",fontSize:12,color:"#7a1c1c",fontWeight:600}}>
                    🔐 Sign in to auto-fill your details & track orders
                  </span>
                  <button onClick={onAuthOpen} style={{background:"#7a1c1c",color:"#f8e9b1",border:"none",borderRadius:6,padding:"6px 14px",fontFamily:"'Josefin Sans',Arial,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:".06em"}}>
                    Sign In →
                  </button>
                </div>
              )}
              {authUser && (
                <div style={{background:"#f0fdf4",border:"1.5px solid #16a34a33",borderRadius:8,padding:"10px 16px",marginBottom:16,fontFamily:"'Josefin Sans',Arial,sans-serif",fontSize:12,color:"#15803d"}}>
                  ✓ Signed in as <strong>{authUser.displayName||authUser.phoneNumber||authUser.email}</strong>
                </div>
              )}
              <div className="frow2">
                <div className="fld"><label>Full Name *</label><input placeholder="Enter full name" value={addr.name} onChange={e=>setAddr({...addr,name:e.target.value})}/></div>
                <div className="fld"><label>Mobile Number *</label><input placeholder="10-digit mobile number" value={addr.phone} onChange={e=>setAddr({...addr,phone:e.target.value.replace(/\D/g,"").slice(0,10)})}/></div>
              </div>
              <div className="fld"><label>Email Address</label><input placeholder="For order confirmation" value={addr.email} onChange={e=>setAddr({...addr,email:e.target.value})}/></div>
              <div className="frow2">
                <div className="fld"><label>Pincode *</label><input placeholder="6-digit pincode" value={addr.pincode} onChange={e=>setAddr({...addr,pincode:e.target.value.replace(/\D/g,"").slice(0,6)})}/></div>
                <div className="fld"><label>City *</label><input placeholder="City" value={addr.city} onChange={e=>setAddr({...addr,city:e.target.value})}/></div>
              </div>
              <div className="fld"><label>State *</label>
                <select value={addr.state} onChange={e=>setAddr({...addr,state:e.target.value})}>
                  <option value="">Select State</option>
                  {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="fld"><label>Full Address *</label><textarea placeholder="House number, street, area…" rows={3} value={addr.address} onChange={e=>setAddr({...addr,address:e.target.value})}/></div>
              <div className="fld"><label>Landmark (Optional)</label><input placeholder="Near school, temple, etc." value={addr.landmark} onChange={e=>setAddr({...addr,landmark:e.target.value})}/></div>
              <button className="btn btn-gold btn-full btn-lg" onClick={()=>{
                if(!addr.name||!addr.phone||!addr.pincode||!addr.address||!addr.city||!addr.state){showToast("Please fill all required fields");return;}
                setStep(2);
              }}>Deliver to this Address →</button>
            </div>
          )}

          {/* STEP 2: PAYMENT */}
          {step===2&&(
            <div className="cosec">
              <h2>💳 Payment Method</h2>
              <div className="pay-tabs">
                {[["upi","UPI"],["card","Card"],["netbanking","Net Banking"],["emi","EMI"],["cod","Cash on Delivery"]].map(([v,l])=>(
                  <button key={v} className={`ptab${payMethod===v?" act":""}`} onClick={()=>setPayMethod(v)}>{l}</button>
                ))}
              </div>

              {payMethod==="upi"&&(
                <div>
                  <p style={{fontFamily:"var(--ui)",fontSize:11,color:"var(--muted)",fontWeight:600,marginBottom:12,letterSpacing:".05em"}}>CHOOSE YOUR UPI APP</p>
                  <div className="upi-apps">
                    {UPI_APPS.map(a=>(
                      <div key={a.id} className={`uapp${upiApp===a.id?" sel":""}`} onClick={()=>setUpiApp(a.id)}>
                        <div className="uapp-icon" style={{background:a.bg,color:a.color}}>{a.letter}</div>
                        <span>{a.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="upi-input-row">
                    <label>Or Enter UPI ID (e.g. name@paytm)</label>
                    <input placeholder="yourname@upi" value={upiId} onChange={e=>setUpiId(e.target.value)}/>
                  </div>
                </div>
              )}

              {payMethod==="card"&&(
                <div>
                  <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                    {["Visa","Mastercard","RuPay","Amex","Diners"].map(b=>(
                      <span key={b} style={{background:"var(--cr2)",color:"var(--m800)",fontFamily:"var(--ui)",fontSize:10,fontWeight:700,padding:"4px 9px",borderRadius:5,border:"1px solid var(--border)"}}>{b}</span>
                    ))}
                  </div>
                  <div className="fld"><label>Card Number</label><input placeholder="1234 5678 9012 3456" value={card.num} onChange={e=>setCard({...card,num:e.target.value.replace(/\D/g,"").slice(0,16)})}/></div>
                  <div className="fld"><label>Name on Card</label><input placeholder="As printed on card" value={card.name} onChange={e=>setCard({...card,name:e.target.value})}/></div>
                  <div className="card-grid">
                    <div className="fld"><label>Expiry Date</label><input placeholder="MM / YY" value={card.exp} onChange={e=>setCard({...card,exp:e.target.value})}/></div>
                    <div className="fld"><label>CVV</label><input placeholder="3-digit CVV" maxLength={4} value={card.cvv} onChange={e=>setCard({...card,cvv:e.target.value.replace(/\D/g,"").slice(0,4)})}/></div>
                  </div>
                </div>
              )}

              {payMethod==="netbanking"&&(
                <div>
                  <div className="fld"><label>Select Your Bank</label>
                    <select className="banksel" value={bank} onChange={e=>setBank(e.target.value)}>
                      <option value="">Choose your bank</option>
                      {BANKS.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  {bank&&<div style={{background:"var(--cr2)",border:"1px solid var(--border)",borderRadius:8,padding:12,marginTop:8,fontFamily:"var(--ui)",fontSize:11,color:"var(--m800)",fontWeight:600}}>You will be redirected to {bank}'s secure payment page.</div>}
                </div>
              )}

              {payMethod==="emi"&&(
                <div>
                  <p style={{fontFamily:"var(--ui)",fontSize:11,color:"var(--muted)",fontWeight:600,marginBottom:12,letterSpacing:".05em"}}>CHOOSE EMI PLAN (No Cost EMI available)</p>
                  <div className="emi-grid">
                    {[["3 Months",fmt(Math.ceil(t.total/3))+"/mo"],["6 Months",fmt(Math.ceil(t.total/6))+"/mo"],["9 Months",fmt(Math.ceil(t.total/9))+"/mo"],["12 Months",fmt(Math.ceil(t.total/12))+"/mo"]].map(([l,sub])=>(
                      <div key={l} className={`emi-opt${emiPlan===l?" sel":""}`} onClick={()=>setEmiPlan(l)}>
                        <strong>{l}</strong>
                        <small>{sub}</small>
                      </div>
                    ))}
                  </div>
                  <div className="fld" style={{marginTop:14}}><label>Card Number (for EMI)</label><input placeholder="Enter card number"/></div>
                </div>
              )}

              {payMethod==="cod"&&(
                <div className="cod-box">
                  <strong>Cash on Delivery</strong>
                  Pay {fmt(t.total)} in cash when your order is delivered. A convenience fee of ₹40 may apply for COD orders.
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:20}}>
                <button className="btn btn-outline" onClick={()=>setStep(1)}>← Back</button>
                <button className="btn btn-gold" style={{flex:1}} onClick={()=>setStep(3)}>Continue to Review →</button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step===3&&(
            <div className="cosec">
              <h2>✅ Review Your Order</h2>
              <div style={{background:"var(--cr2)",border:"1px solid var(--border)",borderRadius:10,padding:14,marginBottom:16}}>
                <p style={{fontFamily:"var(--ui)",fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"var(--m800)",marginBottom:8}}>📍 Delivering to:</p>
                <p style={{fontSize:14,color:"var(--ink)",fontWeight:600}}>{addr.name} · +91 {addr.phone}</p>
                <p style={{fontSize:13,color:"var(--muted)"}}>{addr.address}, {addr.landmark&&addr.landmark+", "}{addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
              <div style={{background:"var(--cr2)",border:"1px solid var(--border)",borderRadius:10,padding:14,marginBottom:16}}>
                <p style={{fontFamily:"var(--ui)",fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"var(--m800)",marginBottom:8}}>💳 Payment:</p>
                <p style={{fontSize:14,color:"var(--ink)",fontWeight:600}}>
                  {payMethod==="upi"?`UPI – ${upiApp?UPI_APPS.find(a=>a.id===upiApp)?.name:upiId||"UPI"}`:
                   payMethod==="card"?"Debit / Credit Card":
                   payMethod==="netbanking"?`Net Banking – ${bank}`:
                   payMethod==="emi"?`EMI – ${emiPlan}`:
                   "Cash on Delivery"}
                </p>
              </div>
              {processing ? (
                <div className="processing">
                  <div className="pspin"/>
                  <h3>Processing your payment…</h3>
                  <p>Please do not press back or refresh</p>
                </div>
              ) : (
                <div style={{display:"flex",gap:10}}>
                  <button className="btn btn-outline" onClick={()=>setStep(2)}>← Back</button>
                  <button className="btn btn-gold" style={{flex:1,fontSize:13}} onClick={handlePlaceOrder}>
                    🔒 Place Order · {fmt(t.total)}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ORDER SUMMARY */}
        <div className="ordsum">
          <h2>Order Summary</h2>
          {items.map(({p,color,qty})=>(
            <div className="oi" key={p.id+color}>
              <img src={p.images[0]} alt={p.name}/>
              <div>
                <div className="oi-n">{p.name}</div>
                <div className="oi-m">Color: {color} · Qty: {qty}</div>
                <div className="oi-p">{fmt(p.price*qty)}</div>
              </div>
            </div>
          ))}
          <div className="osrow"><span>Subtotal</span><strong>{fmt(t.sub)}</strong></div>
          {t.disc>0&&<div className="osrow green"><span>Bundle Discount</span><strong>−{fmt(t.disc)}</strong></div>}
          <div className="osrow"><span>Delivery</span><strong style={{color:t.ship===0?"#276749":"inherit"}}>{t.ship===0?"FREE":fmt(t.ship)}</strong></div>
          <div className="ostotal"><span>Total</span><span>{fmt(t.total)}</span></div>
          {t.disc>0&&<div style={{background:"#c6f6d5",color:"#276749",fontFamily:"var(--ui)",fontSize:11,fontWeight:700,padding:"7px 10px",borderRadius:7,textAlign:"center",marginBottom:10}}>🎉 You save {fmt(t.disc)}!</div>}
          <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",marginTop:10}}>
            {["🔒 Secure","✓ Authentic","↩ Easy Returns"].map(tag=>(
              <span key={tag} style={{fontFamily:"var(--ui)",fontSize:10,fontWeight:700,color:"var(--m700)",background:"var(--cr2)",padding:"3px 7px",borderRadius:4}}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ORDER SUCCESS ────────────────────────────────────────────────────────────
function SuccessPage({ navigate, pageData }) {
  const order = pageData?.order;
  if(!order) { navigate("home"); return null; }
  return (
    <div className="sucpage">
      <div className="suc-icon">✓</div>
      <h1>Order Placed!</h1>
      <p>Thank you, <strong>{order.customer.name}</strong>! Your order has been confirmed.</p>
      <p style={{fontSize:"0.9rem"}}>We'll send updates to {order.customer.phone&&`+91 ${order.customer.phone}`}{order.customer.email&&` · ${order.customer.email}`}</p>
      <div className="oid">Order ID: {order.id}</div>
      <div className="track-info">
        <h3>Delivery Timeline</h3>
        {[
          ["Order Confirmed","Just now",true],
          ["Packed & Dispatched","Expected in 1–2 days",true],
          ["Out for Delivery","Expected in 3–5 days",false],
          ["Delivered","Expected by "+new Date(Date.now()+432000000).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}),false],
        ].map(([tl,sub,done])=>(
          <div className="track-row" key={tl}>
            <div className="track-dot" style={{background:done?"var(--g600)":"var(--border)"}}/>
            <div><p style={{color:done?"var(--ink)":"var(--muted)"}}>{tl}</p><small>{sub}</small></div>
          </div>
        ))}
      </div>
      <div className="suc-actions" style={{marginTop:22}}>
        <button className="btn btn-gold" onClick={()=>navigate("home")}>Continue Shopping</button>
        <button className="btn btn-outline" onClick={()=>navigate("products",{collection:"trending"})}>Browse More Sarees</button>
      </div>
    </div>
  );
}

// AdminPage is now in src/AdminPage.jsx — uses Firebase Auth + Firestore

// ═══════════════════════ MAIN APP ══════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [pageData, setPageData] = useState({});
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [newOrders, setNewOrders] = useState(0);
  const [authUser, setAuthUser] = useState(undefined);
  const [authOpen, setAuthOpen] = useState(false);
  // ── Live products from Firestore ──────────────────────────────────────────
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const seededRef = useRef(false);
  const toastTimer = useRef(null);

  // Listen to Firestore products; auto-seed DEFAULT_PRODUCTS if collection empty
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), async (snap) => {
      if (snap.empty && !seededRef.current) {
        seededRef.current = true;
        // Write all DEFAULT_PRODUCTS to Firestore on first run
        const batch = writeBatch(db);
        DEFAULT_PRODUCTS.forEach((p) => {
          const ref = doc(collection(db, "products"));
          batch.set(ref, { ...p, createdAt: Date.now() });
        });
        await batch.commit().catch(console.error);
        // onSnapshot will fire again with the seeded data
      } else if (!snap.empty) {
        const docs = snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
        setProducts(docs);
      }
    });
    return unsub;
  }, []);

  // Listen to customer auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setAuthUser(user ?? null));
    return unsub;
  }, []);

  // Secret admin: click brand logo 5 times quickly
  const _adminClicks = useRef(0);
  const _adminTimer = useRef(null);
  const handleSecretAdmin = useCallback(() => {
    _adminClicks.current++;
    clearTimeout(_adminTimer.current);
    _adminTimer.current = setTimeout(() => { _adminClicks.current = 0; }, 2000);
    if (_adminClicks.current >= 5) {
      _adminClicks.current = 0;
      setPage("admin"); setPageData({});
    }
  }, []);


  // Load cart from storage on mount
  useEffect(()=>{
    (async()=>{
      try {
        const r = await window.storage.get("zs_cart2");
        if(r) setCart(JSON.parse(r.value));
      } catch(e){}
      setCartLoaded(true);
    })();
  },[]);

  // Persist cart to storage
  useEffect(()=>{
    if(!cartLoaded) return;
    window.storage.set("zs_cart2", JSON.stringify(cart)).catch(()=>{});
  },[cart, cartLoaded]);

  // Real-time new orders badge from Firestore
  useEffect(()=>{
    const q = query(collection(db, "orders"), where("status", "==", "new"));
    const unsub = onSnapshot(q, (snap)=>{ setNewOrders(snap.size); }, ()=>{});
    return unsub;
  },[]);

  // Scroll to top on page change
  useEffect(()=>{ window.scrollTo({top:0,behavior:"smooth"}); },[page]);

  // Body scroll lock
  useEffect(()=>{
    if(cartOpen||menuOpen||searchOpen) document.body.classList.add("noscroll");
    else document.body.classList.remove("noscroll");
  },[cartOpen,menuOpen,searchOpen]);

  const navigate = useCallback((p, d={})=>{
    setPage(p); setPageData(d);
    setCartOpen(false); setMenuOpen(false); setSearchOpen(false);
  },[]);

  const showToast = useCallback((msg)=>{
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current=setTimeout(()=>setToastMsg(""),2400);
  },[]);

  const addToCart = useCallback((id, color, qty=1)=>{
    setCart(prev=>{
      const ex=prev.find(i=>i.id===id&&i.color===color);
      if(ex) return prev.map(i=>i.id===id&&i.color===color?{...i,qty:i.qty+qty}:i);
      return [...prev,{id,color,qty}];
    });
    setCartOpen(true);
    showToast("Added to cart ✓");
  },[showToast]);

  const updateQty = useCallback((id, color, delta)=>{
    setCart(prev=>prev.map(i=>i.id===id&&i.color===color?{...i,qty:Math.max(1,i.qty+delta)}:i));
  },[]);

  const removeItem = useCallback((id, color)=>{
    setCart(prev=>prev.filter(i=>!(i.id===id&&i.color===color)));
    showToast("Item removed");
  },[showToast]);

  const clearCart = useCallback(()=>setCart([]),[]);
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const overlayOn = cartOpen||menuOpen||searchOpen;

  const isAdmin = page === "admin";

  return (
    <ProductsCtx.Provider value={products}>
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      {!isAdmin && (
        <>
          <AnnouncementBar/>
          <Header navigate={navigate} cartCount={cartCount} onCartOpen={()=>setCartOpen(true)} onSearch={()=>setSearchOpen(true)} onMenu={()=>setMenuOpen(true)}
            onSecretClick={handleSecretAdmin} newOrders={newOrders}
            authUser={authUser} onAuthOpen={()=>setAuthOpen(true)} onSignOut={()=>{ signOut(auth); showToast("Signed out"); }}/>
          <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onSuccess={(u)=>{ showToast(`Welcome, ${u.displayName||u.phoneNumber||"there"}! 🎉`); }}/>
          <MobileMenu open={menuOpen} onClose={()=>setMenuOpen(false)} navigate={navigate}/>
          <div className={`overlay${overlayOn?" on":""}`} onClick={()=>{setCartOpen(false);setMenuOpen(false);setSearchOpen(false);}}/>
          <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} updateQty={updateQty} removeItem={removeItem} navigate={navigate}/>
          <SearchModal open={searchOpen} onClose={()=>setSearchOpen(false)} navigate={navigate}/>
        </>
      )}
      <main>
        {page==="home"&&<HomePage navigate={navigate} onAddToCart={addToCart}/>}
        {page==="products"&&<ProductsPage navigate={navigate} pageData={pageData} onAddToCart={addToCart}/>}
        {page==="detail"&&<DetailPage navigate={navigate} pageData={pageData} onAddToCart={addToCart}/>}
        {page==="cart"&&<CartPage navigate={navigate} cart={cart} updateQty={updateQty} removeItem={removeItem}/>}
        {page==="checkout"&&<CheckoutPage navigate={navigate} cart={cart} clearCart={clearCart} showToast={showToast} authUser={authUser} onAuthOpen={()=>setAuthOpen(true)}/>}
        {page==="success"&&<SuccessPage navigate={navigate} pageData={pageData}/>}
        {page==="admin"&&<AdminPage navigate={navigate}/>}
      </main>
      {!isAdmin&&<Footer navigate={navigate}/>}
      {!isAdmin&&<WhatsAppFloat/>}
      <Toast msg={toastMsg}/>
    </>
    </ProductsCtx.Provider>
  );
}
