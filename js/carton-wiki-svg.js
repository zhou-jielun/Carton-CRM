// ================================================================
//  Carton Wiki — SVG 展开图 + 3D视图生成器
//  为每种纸箱类型生成带尺寸标注的展开图和3D折叠视图
//  用法：WikiS.getCartonSVGs(id) → {unfold: SVG字符串, fold: SVG字符串}
// ================================================================

(function () {
  'use strict';

  // ============================================================
  //  工具函数
  // ============================================================

  // 创建 SVG 元素字符串
  function makeEl(tag, attrs, children) {
    var attrStr = '';
    for (var k in attrs) {
      if (attrs.hasOwnProperty(k)) {
        attrStr += ' ' + k + '="' + attrs[k] + '"';
      }
    }
    var inner = '';
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) inner += children[i];
    } else if (typeof children === 'string') {
      inner = children;
    }
    return '<' + tag + attrStr + '>' + inner + '</' + tag + '>';
  }

  // 尺寸标注线
  function dimLine(x1, y1, x2, y2, label, options) {
    var opts = options || {};
    var color = opts.color || '#E84923';
    var fontSize = opts.fontSize || 11;
    var offset = opts.offset || 0;
    var isVert = Math.abs(x2 - x1) < 1;
    var lines = '';

    if (isVert) {
      var lx = x1 - 28 - offset;
      var mx = (y1 + y2) / 2;
      lines += makeEl('line', { x1:lx, y1:y1, x2:lx, y2:y2, stroke:color, 'stroke-width':1.2, 'stroke-dasharray':'4,2' });
      lines += makeEl('polygon', { points: (lx-4)+','+(y1+4)+' '+(lx)+','+y1+' '+(lx+4)+','+(y1+4), fill:color });
      lines += makeEl('polygon', { points: (lx-4)+','+(y2-4)+' '+(lx)+','+y2+' '+(lx+4)+','+(y2-4), fill:color });
      lines += makeEl('text', { x:lx-6, y:mx, fill:color, 'font-size':fontSize, 'font-weight':'600', 'text-anchor':'end', 'dominant-baseline':'middle' }, [label]);
    } else {
      var ly = y1 + 28 + offset;
      var mx2 = (x1 + x2) / 2;
      lines += makeEl('line', { x1:x1, y1:ly, x2:x2, y2:ly, stroke:color, 'stroke-width':1.2, 'stroke-dasharray':'4,2' });
      lines += makeEl('polygon', { points: (x1)+','+(ly-4)+' '+(x1+4)+','+ly+' '+(x1)+','+(ly+4), fill:color });
      lines += makeEl('polygon', { points: (x2)+','+(ly-4)+' '+(x2-4)+','+ly+' '+(x2)+','+(ly+4), fill:color });
      lines += makeEl('text', { x:mx2, y:ly+16, fill:color, 'font-size':fontSize, 'font-weight':'600', 'text-anchor':'middle' }, [label]);
    }
    return lines;
  }

  // 折痕线（虚线）
  function foldLine(x1, y1, x2, y2, color) {
    var c = color || '#4A90D9';
    return makeEl('line', { x1:x1, y1:y1, x2:x2, y2:y2, stroke:c, 'stroke-width':1, 'stroke-dasharray':'5,3', opacity:0.7 });
  }

  // 切割线（红色点划线）
  function cutLine(x1, y1, x2, y2) {
    return makeEl('line', { x1:x1, y1:y1, x2:x2, y2:y2, stroke:'#E84923', 'stroke-width':1.5, 'stroke-dasharray':'8,4' });
  }

  // 矩形（带可选文字和阴影）
  function rectWithText(x, y, w, h, text, bgColor, textColor, opts) {
    var o = opts || {};
    var rx = o.rx || 0;
    var stroke = o.stroke || '#7A6345';
    var strokeWidth = o.strokeWidth || 1;
    var fontSize = o.fontSize || 10;
    var shadow = o.shadow || false;
    var defs = '';
    var filterAttr = '';
    if (shadow) {
      var fid = 'sh' + Math.random().toString(36).substr(2, 5);
      defs = makeEl('defs', {}, [
        makeEl('filter', { id:fid, x:-0.1, y:-0.1, width:1.2, height:1.2 }, [
          makeEl('feDropShadow', { dx:1, dy:2, 'stdDeviation':2, 'flood-color':'#00000020' })
        ])
      ]);
      filterAttr = 'filter:url(#' + fid + ')';
    }
    var r = makeEl('rect', { x:x, y:y, width:w, height:h, rx:rx, fill:bgColor, stroke:stroke, 'stroke-width':strokeWidth, transform:filterAttr });
    var t = '';
    if (text) {
      t = makeEl('text', { x:x+w/2, y:y+h/2, fill:textColor||'#333', 'font-size':fontSize, 'font-weight':'500', 'text-anchor':'middle', 'dominant-baseline':'middle' }, [text]);
    }
    return defs + r + t;
  }

  // ============================================================
  //  RSC 展开图 — 水平长条纸板（真实牛皮纸风格）
  // ============================================================
  function makeUnfoldSVG_RSC(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 640, svgH = 420;
    var scale = 0.32;

    // 牛皮纸颜色
    var cBoard = '#C8A97A';
    var cBoardDark = '#B89B6E';
    var cBoardLight = '#D4B896';
    var cCut = '#5C4033';
    var cFold = '#8B7355';

    var pL = Math.round(L * scale);
    var pW = Math.round(W * scale);
    var pH = Math.round(H * scale);
    var pGlue = Math.round(W * 0.4 * scale);  // glue flap 约 40% W
    var pFlap = Math.round(W * 0.5 * scale);  // 上下摇盖 = W/2

    // 布局：glue flap + W + L + W + L (水平5区) + 上下flap
    var totalW = pGlue + pW + pL + pW + pL;
    var totalH = pFlap + pH + pFlap;

    var ox = Math.round((svgW - totalW) / 2);
    var oy = Math.round((svgH - totalH) / 2) + 10;

    // x坐标：glue | W | L | W | L
    var xg = ox;
    var x0 = xg + pGlue;
    var x1 = x0 + pW;
    var x2 = x1 + pL;
    var x3 = x2 + pW;
    var x4 = x3 + pL;

    // y坐标：上flap | 主体H | 下flap
    var y0 = oy;            // 上flap顶
    var y1 = y0 + pFlap;    // 主体顶 = 上flap底
    var y2 = y1 + pH;       // 主体底 = 下flap顶
    var y3 = y2 + pFlap;    // 下flap底

    var parts = '';

    // 定义阴影滤镜
    var fid = 'sh' + Math.random().toString(36).substr(2, 5);
    parts += makeEl('defs', {}, [
      makeEl('filter', { id:fid, x:-0.02, y:-0.02, width:1.04, height:1.04 }, [
        makeEl('feDropShadow', { dx:0, dy:2, 'stdDeviation':3, 'flood-color':'#00000018' })
      ])
    ]);

    // === 主体纸板（底层大矩形，统一棕色）===
    parts += makeEl('rect', { x:xg, y:y0, width:totalW, height:totalH, fill:cBoard, stroke:'none', filter:'url(#' + fid + ')' });

    // === 各panel用略深的颜色区分（营造纸板拼接感）===
    // 上排flaps（4个）
    parts += makeEl('rect', { x:x0, y:y0, width:pW, height:pFlap, fill:cBoardLight, stroke:'none' });
    parts += makeEl('rect', { x:x1, y:y0, width:pL, height:pFlap, fill:cBoardDark, stroke:'none' });
    parts += makeEl('rect', { x:x2, y:y0, width:pW, height:pFlap, fill:cBoardLight, stroke:'none' });
    parts += makeEl('rect', { x:x3, y:y0, width:pL, height:pFlap, fill:cBoardDark, stroke:'none' });

    // 下排flaps（4个）
    parts += makeEl('rect', { x:x0, y:y2, width:pW, height:pFlap, fill:cBoardLight, stroke:'none' });
    parts += makeEl('rect', { x:x1, y:y2, width:pL, height:pFlap, fill:cBoardDark, stroke:'none' });
    parts += makeEl('rect', { x:x2, y:y2, width:pW, height:pFlap, fill:cBoardLight, stroke:'none' });
    parts += makeEl('rect', { x:x3, y:y2, width:pL, height:pFlap, fill:cBoardDark, stroke:'none' });

    // 中间主体（4个侧面）
    parts += makeEl('rect', { x:xg, y:y1, width:pGlue, height:pH, fill:cBoardLight, stroke:'none' });  // glue flap
    parts += makeEl('rect', { x:x0, y:y1, width:pW, height:pH, fill:cBoard, stroke:'none' });
    parts += makeEl('rect', { x:x1, y:y1, width:pL, height:pH, fill:cBoardDark, stroke:'none' });
    parts += makeEl('rect', { x:x2, y:y1, width:pW, height:pH, fill:cBoard, stroke:'none' });
    parts += makeEl('rect', { x:x3, y:y1, width:pL, height:pH, fill:cBoardDark, stroke:'none' });

    // === 折痕线（虚线，棕色）===
    // 竖向折痕（panel分隔线）
    parts += makeEl('line', { x1:x0, y1:y0, x2:x0, y2:y3, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('line', { x1:x1, y1:y0, x2:x1, y2:y3, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('line', { x1:x2, y1:y0, x2:x2, y2:y3, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('line', { x1:x3, y1:y0, x2:x3, y2:y3, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });

    // 横向折痕（flap与主体分隔）
    parts += makeEl('line', { x1:xg, y1:y1, x2:x4, y2:y1, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('line', { x1:xg, y1:y2, x2:x4, y2:y2, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });

    // === 切割线（实线，深棕色，纸板外轮廓）===
    var cutPath = 'M' + xg + ',' + y0 +
                  ' L' + x4 + ',' + y0 +
                  ' L' + x4 + ',' + y3 +
                  ' L' + xg + ',' + y3 + ' Z';
    parts += makeEl('path', { d:cutPath, fill:'none', stroke:cCut, 'stroke-width':1.5 });

    // === 尺寸标注 ===
    // W 标注（第一个panel宽度）
    parts += dimLine(x0, y3 + 28, x1, y3 + 28, 'W=' + W + unit, { color:'#5C4033', fontSize:12 });
    // L 标注（第二个panel宽度）
    parts += dimLine(x1, y3 + 28, x2, y3 + 28, 'L=' + L + unit, { color:'#5C4033', fontSize:12, offset:22 });
    // D/H 标注（高度，在右侧）
    parts += dimLine(x4 + 32, y1, x4 + 32, y2, 'D=' + H + unit, { color:'#5C4033', fontSize:12 });

    // === 标题 ===
    parts += makeEl('text', { x:svgW/2, y:26, fill:'#1D1D1F', 'font-size':15, 'font-weight':'700', 'text-anchor':'middle' }, ['RSC 展开示意图（常规开槽纸箱）']);

    // === 图例 ===
    var legY = svgH - 18;
    parts += makeEl('line', { x1:svgW-260, y1:legY, x2:svgW-238, y2:legY, stroke:cCut, 'stroke-width':1.5 });
    parts += makeEl('text', { x:svgW-232, y:legY+4, fill:'#5C4033', 'font-size':10 }, ['切割线（模切刀口）']);
    parts += makeEl('line', { x1:svgW-120, y1:legY, x2:svgW-98, y2:legY, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('text', { x:svgW-92, y:legY+4, fill:'#8B7355', 'font-size':10 }, ['折痕线（压痕）']);

    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  // ============================================================
  //  RSC 3D 折叠视图（棕色真实纸箱质感 + 光影）
  // ============================================================
  function make3DSVG_RSC(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW / 2, oy = 55;
    var s = 0.45;
    var ax = 0.866, ay = 0.5;

    function iso(x, y, z) {
      return { x: ox + (x - z) * ax * s, y: oy + (y + (x + z) * ay * s) };
    }

    // 棕色牛皮纸色系（带光影层次）
    var cFront  = '#C8A97A';   // 正面（受光面）
    var cRight  = '#A88B5E';   // 右侧面（半阴）
    var cLeft   = '#8B7355';   // 左侧面（阴影）
    var cBack   = '#B89B6E';   // 背面
    var cTop    = '#D4B896';   // 顶面（最亮）
    var cFlap   = '#B89B6E';   // 摇盖
    var cStroke = '#7A6345';   // 边框色

    var p = {
      b1: iso(0,0,0), b2: iso(L,0,0), b3: iso(L,0,W), b4: iso(0,0,W),
      t1: iso(0,H,0), t2: iso(L,H,0), t3: iso(L,H,W), t4: iso(0,H,W)
    };

    var parts = '';

    // 定义纸箱底部阴影
    var shadId = 'sd' + Math.random().toString(36).substr(2, 5);
    parts += makeEl('defs', {}, [
      makeEl('filter', { id:shadId, x:-0.3, y:-0.1, width:1.6, height:1.4 }, [
        makeEl('feDropShadow', { dx:3, dy:8, 'stdDeviation':6, 'flood-color':'#00000022' })
      ])
    ]);

    // 后盖（打开，z=0侧）
    var bg1 = iso(L*0.05, H, -2);
    var bg2 = iso(L*0.95, H, -2);
    var bg3 = iso(L*0.95, H+28, -8);
    var bg4 = iso(L*0.05, H+28, -8);
    parts += makeEl('polygon', { points: bg1.x+','+bg1.y+' '+bg2.x+','+bg2.y+' '+bg3.x+','+bg3.y+' '+bg4.x+','+bg4.y, fill:cFlap, stroke:cStroke, 'stroke-width':0.8, opacity:0.85 });

    // 左盖（打开，x=0侧）
    var lg1 = iso(-2, H, W*0.05);
    var lg2 = iso(-2, H, W*0.95);
    var lg3 = iso(-8, H+24, W*0.95);
    var lg4 = iso(-8, H+24, W*0.05);
    parts += makeEl('polygon', { points: lg1.x+','+lg1.y+' '+lg2.x+','+lg2.y+' '+lg3.x+','+lg3.y+' '+lg4.x+','+lg4.y, fill:cFlap, stroke:cStroke, 'stroke-width':0.8, opacity:0.85 });

    // 后面（z=0）
    parts += makeEl('polygon', { points: p.b1.x+','+p.b1.y+' '+p.b2.x+','+p.b2.y+' '+p.t2.x+','+p.t2.y+' '+p.t1.x+','+p.t1.y, fill:cBack, stroke:cStroke, 'stroke-width':0.8 });
    // 左面（x=0）
    parts += makeEl('polygon', { points: p.b1.x+','+p.b1.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t1.x+','+p.t1.y, fill:cLeft, stroke:cStroke, 'stroke-width':0.8 });
    // 右面（x=L）
    parts += makeEl('polygon', { points: p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+p.t3.x+','+p.t3.y+' '+p.t2.x+','+p.t2.y, fill:cRight, stroke:cStroke, 'stroke-width':0.8 });
    // 前面（z=W）
    parts += makeEl('polygon', { points: p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t3.x+','+p.t3.y, fill:cFront, stroke:cStroke, 'stroke-width':0.8, filter:'url(#' + shadId + ')' });
    // 顶面
    parts += makeEl('polygon', { points: p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y, fill:cTop, stroke:cStroke, 'stroke-width':0.8 });

    // 前盖（打开，z=W侧，最上层）
    var fg1 = iso(L*0.05, H, W+2);
    var fg2 = iso(L*0.95, H, W+2);
    var fg3 = iso(L*0.95, H+28, W+8);
    var fg4 = iso(L*0.05, H+28, W+8);
    parts += makeEl('polygon', { points: fg1.x+','+fg1.y+' '+fg2.x+','+fg2.y+' '+fg3.x+','+fg3.y+' '+fg4.x+','+fg4.y, fill:cFlap, stroke:cStroke, 'stroke-width':0.8, opacity:0.9 });

    // 右盖（打开，x=L侧）
    var rg1 = iso(L+2, H, W*0.05);
    var rg2 = iso(L+2, H, W*0.95);
    var rg3 = iso(L+8, H+24, W*0.95);
    var rg4 = iso(L+8, H+24, W*0.05);
    parts += makeEl('polygon', { points: rg1.x+','+rg1.y+' '+rg2.x+','+rg2.y+' '+rg3.x+','+rg3.y+' '+rg4.x+','+rg4.y, fill:cFlap, stroke:cStroke, 'stroke-width':0.8, opacity:0.85 });

    // 内部阴影（模拟开口处）
    var innerPts = p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y;
    parts += makeEl('polygon', { points: innerPts, fill:'#6B5638', opacity:0.15 });

    // 标注（棕色系）
    parts += dimLine(p.b1.x, p.b1.y + 18, p.b2.x, p.b2.y + 18, 'L='+L+unit, { color:'#5C4033', fontSize:12, offset:0 });
    parts += dimLine(p.t1.x - 22, p.t1.y, p.t1.x - 22, p.b1.y, 'D='+H+unit, { color:'#5C4033', fontSize:12, offset:0 });
    parts += dimLine(p.b3.x + 18, p.b3.y, p.t3.x + 18, p.t3.y, 'W='+W+unit, { color:'#5C4033', fontSize:12, offset:0 });

    // 标题
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':14, 'font-weight':'700', 'text-anchor':'middle' }, ['RSC 3D 折叠视图']);

    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  // ============================================================
  //  HSC 展开图（顶部开口无盖）— 水平长条纸板
  // ============================================================
  function makeUnfoldSVG_HSC(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 640, svgH = 360;
    var scale = 0.32;

    var cBoard = '#C8A97A', cBoardDark = '#B89B6E', cBoardLight = '#D4B896';
    var cCut = '#5C4033', cFold = '#8B7355';

    var pL = Math.round(L * scale);
    var pW = Math.round(W * scale);
    var pH = Math.round(H * scale);
    var pGlue = Math.round(W * 0.4 * scale);
    var pFlap = Math.round(W * 0.5 * scale);

    // HSC无上flap，只有下flap
    var totalW = pGlue + pW + pL + pW + pL;
    var totalH = pH + pFlap;

    var ox = Math.round((svgW - totalW) / 2);
    var oy = Math.round((svgH - totalH) / 2) + 10;

    var xg = ox;
    var x0 = xg + pGlue;
    var x1 = x0 + pW;
    var x2 = x1 + pL;
    var x3 = x2 + pW;
    var x4 = x3 + pL;

    var y0 = oy;        // 主体顶
    var y1 = y0 + pH;   // 主体底 = 下flap顶
    var y2 = y1 + pFlap;// 下flap底

    var parts = '';
    var fid = 'sh' + Math.random().toString(36).substr(2, 5);
    parts += makeEl('defs', {}, [
      makeEl('filter', { id:fid, x:-0.02, y:-0.02, width:1.04, height:1.04 }, [
        makeEl('feDropShadow', { dx:0, dy:2, 'stdDeviation':3, 'flood-color':'#00000018' })
      ])
    ]);

    // 主体纸板
    parts += makeEl('rect', { x:xg, y:y0, width:totalW, height:totalH, fill:cBoard, stroke:'none', filter:'url(#' + fid + ')' });

    // 下排flaps
    parts += makeEl('rect', { x:x0, y:y1, width:pW, height:pFlap, fill:cBoardLight, stroke:'none' });
    parts += makeEl('rect', { x:x1, y:y1, width:pL, height:pFlap, fill:cBoardDark, stroke:'none' });
    parts += makeEl('rect', { x:x2, y:y1, width:pW, height:pFlap, fill:cBoardLight, stroke:'none' });
    parts += makeEl('rect', { x:x3, y:y1, width:pL, height:pFlap, fill:cBoardDark, stroke:'none' });

    // 中间主体
    parts += makeEl('rect', { x:xg, y:y0, width:pGlue, height:pH, fill:cBoardLight, stroke:'none' });
    parts += makeEl('rect', { x:x0, y:y0, width:pW, height:pH, fill:cBoard, stroke:'none' });
    parts += makeEl('rect', { x:x1, y:y0, width:pL, height:pH, fill:cBoardDark, stroke:'none' });
    parts += makeEl('rect', { x:x2, y:y0, width:pW, height:pH, fill:cBoard, stroke:'none' });
    parts += makeEl('rect', { x:x3, y:y0, width:pL, height:pH, fill:cBoardDark, stroke:'none' });

    // 折痕线
    parts += makeEl('line', { x1:x0, y1:y0, x2:x0, y2:y2, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('line', { x1:x1, y1:y0, x2:x1, y2:y2, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('line', { x1:x2, y1:y0, x2:x2, y2:y2, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('line', { x1:x3, y1:y0, x2:x3, y2:y2, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('line', { x1:xg, y1:y1, x2:x4, y2:y1, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });

    // 切割线
    var cutPath = 'M' + xg + ',' + y0 + ' L' + x4 + ',' + y0 + ' L' + x4 + ',' + y2 + ' L' + xg + ',' + y2 + ' Z';
    parts += makeEl('path', { d:cutPath, fill:'none', stroke:cCut, 'stroke-width':1.5 });

    // 顶部开口标识
    parts += makeEl('text', { x:svgW/2, y:y0-8, fill:'#E84923', 'font-size':11, 'font-weight':'600', 'text-anchor':'middle' }, ['\u26A0 顶部开口（无摇盖）']);

    // 尺寸标注
    parts += dimLine(x0, y2 + 28, x1, y2 + 28, 'W=' + W + unit, { color:'#5C4033', fontSize:12 });
    parts += dimLine(x1, y2 + 28, x2, y2 + 28, 'L=' + L + unit, { color:'#5C4033', fontSize:12, offset:22 });
    parts += dimLine(x4 + 32, y0, x4 + 32, y1, 'D=' + H + unit, { color:'#5C4033', fontSize:12 });

    parts += makeEl('text', { x:svgW/2, y:26, fill:'#1D1D1F', 'font-size':15, 'font-weight':'700', 'text-anchor':'middle' }, ['HSC 展开示意图（顶部开口无盖）']);

    var legY = svgH - 18;
    parts += makeEl('line', { x1:svgW-260, y1:legY, x2:svgW-238, y2:legY, stroke:cCut, 'stroke-width':1.5 });
    parts += makeEl('text', { x:svgW-232, y:legY+4, fill:'#5C4033', 'font-size':10 }, ['切割线（模切刀口）']);
    parts += makeEl('line', { x1:svgW-120, y1:legY, x2:svgW-98, y2:legY, stroke:cFold, 'stroke-width':1, 'stroke-dasharray':'4,3' });
    parts += makeEl('text', { x:svgW-92, y:legY+4, fill:'#8B7355', 'font-size':10 }, ['折痕线（压痕）']);

    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_HSC(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW/2, oy = 55;
    var s = 0.45, ax = 0.866, ay = 0.5;
    function iso(x,y,z){ return {x:ox+(x-z)*ax*s, y:oy+(y+(x+z)*ay*s)}; }

    var cFront = '#C8A97A', cRight = '#A88B5E', cLeft = '#8B7355', cBack = '#B89B6E', cTop = '#D4B896';
    var cStroke = '#7A6345';

    var p={b1:iso(0,0,0),b2:iso(L,0,0),b3:iso(L,0,W),b4:iso(0,0,W),
           t1:iso(0,H,0),t2:iso(L,H,0),t3:iso(L,H,W),t4:iso(0,H,W)};
    var parts='';

    var shadId = 'sd' + Math.random().toString(36).substr(2, 5);
    parts += makeEl('defs', {}, [
      makeEl('filter', { id:shadId, x:-0.3, y:-0.1, width:1.6, height:1.4 }, [
        makeEl('feDropShadow', { dx:3, dy:8, 'stdDeviation':6, 'flood-color':'#00000022' })
      ])
    ]);

    // 下摇盖（闭合状态）
    var flapL1 = iso(0, 0, W*0.05);
    var flapL2 = iso(0, 0, W*0.95);
    var flapL3 = iso(-W*0.45, 2, W*0.95);
    var flapL4 = iso(-W*0.45, 2, W*0.05);
    parts+=makeEl('polygon',{points:flapL1.x+','+flapL1.y+' '+flapL2.x+','+flapL2.y+' '+flapL3.x+','+flapL3.y+' '+flapL4.x+','+flapL4.y,fill:cBack,stroke:cStroke,'stroke-width':0.8,opacity:0.9});

    parts+=makeEl('polygon',{points:p.b1.x+','+p.b1.y+' '+p.b2.x+','+p.b2.y+' '+p.t2.x+','+p.t2.y+' '+p.t1.x+','+p.t1.y,fill:cBack,stroke:cStroke,'stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b1.x+','+p.b1.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t1.x+','+p.t1.y,fill:cLeft,stroke:cStroke,'stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+p.t3.x+','+p.t3.y+' '+p.t2.x+','+p.t2.y,fill:cRight,stroke:cStroke,'stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t3.x+','+p.t3.y,fill:cFront,stroke:cStroke,'stroke-width':0.8,filter:'url(#'+shadId+')'});

    // 顶部开口（无顶面，显示内部）
    var innerPts = p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y;
    parts+=makeEl('polygon',{points:innerPts,fill:'#6B5638',opacity:0.2});
    parts+=makeEl('line',{x1:p.t1.x,y1:p.t1.y,x2:p.t4.x,y2:p.t4.y,stroke:'#E84923','stroke-width':1.5,'stroke-dasharray':'5,3'});
    parts+=makeEl('line',{x1:p.t1.x,y1:p.t1.y,x2:p.t2.x,y2:p.t2.y,stroke:'#E84923','stroke-width':1.5,'stroke-dasharray':'5,3'});
    parts+=makeEl('line',{x1:p.t2.x,y1:p.t2.y,x2:p.t3.x,y2:p.t3.y,stroke:'#E84923','stroke-width':1.5,'stroke-dasharray':'5,3'});
    parts+=makeEl('line',{x1:p.t3.x,y1:p.t3.y,x2:p.t4.x,y2:p.t4.y,stroke:'#E84923','stroke-width':1.5,'stroke-dasharray':'5,3'});

    parts+=dimLine(p.b1.x,p.b1.y+18,p.b2.x,p.b2.y+18,'L='+L+unit,{color:'#5C4033',fontSize:12,offset:0});
    parts+=dimLine(p.t1.x-22,p.t1.y,p.t1.x-22,p.b1.y,'D='+H+unit,{color:'#5C4033',fontSize:12,offset:0});
    parts+=dimLine(p.b3.x+18,p.b3.y,p.t3.x+18,p.t3.y,'W='+W+unit,{color:'#5C4033',fontSize:12,offset:0});

    parts+=makeEl('text',{x:svgW/2,y:22,fill:'#1D1D1F','font-size':14,'font-weight':'700','text-anchor':'middle'},['HSC 3D 视图（顶部开口）']);
    return makeEl('svg',{viewBox:'0 0 '+svgW+' '+svgH,xmlns:'http://www.w3.org/2000/svg',style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;'},[parts]);
  }

  // ============================================================
  //  FOL 展开图（全叠盖）
  // ============================================================
  function makeUnfoldSVG_FOL(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var scale = 0.40;
    var ox = 35, oy = 70;
    var LW = Math.round(L * scale), WW = Math.round(W * scale), HH = Math.round(H * scale);
    var overlap = Math.round(WW * 0.35);
    var parts = '';

    parts += rectWithText(ox + HH, oy, LW + overlap, WW, '', '#C8A97A', '#333', { shadow:true });
    parts += rectWithText(ox, oy, HH, WW, '', '#C8A97A', '#333');
    parts += rectWithText(ox + HH + LW, oy, HH + overlap, WW, '', '#D4B896', '#666', { stroke:'#8B7355' });
    // 叠盖区域（斜线填充）
    parts += makeEl('rect', { x:ox+HH+LW-10, y:oy, width:overlap+10, height:WW, fill:'url(#hatchFOL)', stroke:'#7A6345', 'stroke-width':1, opacity:0.4 });
    parts += makeEl('defs', {}, [makeEl('pattern', { id:'hatchFOL', patternUnits:'userSpaceOnUse', width:6, height:6, patternTransform:'rotate(45)' }, [
      makeEl('line', { x1:0, y1:0, x2:0, y2:6, stroke:'#FF9500', 'stroke-width':1, opacity:0.6 })
    ])]);

    parts += foldLine(ox + HH, oy, ox + HH, oy + WW);
    parts += foldLine(ox + HH + LW, oy, ox + HH + LW, oy + WW);

    parts += dimLine(ox + HH, oy + WW + 35, ox + HH + LW + overlap, oy + WW + 35, 'L+叠盖='+(L+Math.round(overlap/scale))+unit, { color:'#E84923' });
    parts += dimLine(ox - 35, oy, ox - 35, oy + WW, 'H='+H+unit, { color:'#007AFF' });

    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['FOL 展开图（摇盖完全重叠）']);
    parts += makeEl('text', { x:svgW/2, y:40, fill:'#FF9500', 'font-size':11, 'text-anchor':'middle' }, ['\u25A3 斜线区域 = 叠盖部分（双重保护）']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_FOL(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW/2, oy = 55;
    var s = 0.45, ax = 0.866, ay = 0.5;
    function iso(x,y,z){ return {x:ox+(x-z)*ax*s, y:oy+(y+(x+z)*ay*s)}; }
    var c1='#C8A97A',c2='#B89B6E';
    var p={b1:iso(0,0,0),b2:iso(L,0,0),b3:iso(L,0,W),b4:iso(0,0,W),
           t1:iso(0,H,0),t2:iso(L,H,0),t3:iso(L,H,W),t4:iso(0,H,W)};
    var parts='';
    parts+=makeEl('polygon',{points:p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+p.t3.x+','+p.t3.y+' '+p.t2.x+','+p.t2.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t3.x+','+p.t3.y,fill:c2,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    // 叠盖示意（顶部双层）
    parts+=makeEl('polygon',{points:(p.t1.x-5)+','+(p.t1.y-3)+' '+(p.t2.x+5)+','+(p.t2.y-3)+' '+(p.t2.x+5)+','+p.t2.y+' '+(p.t1.x-5)+','+p.t1.y,fill:'none',stroke:'#FF9500','stroke-width':1.5,'stroke-dasharray':'4,2'});
    parts+=makeEl('text',{x:svgW/2,y:22,fill:'#1D1D1F','font-size':13,'font-weight':'700','text-anchor':'middle'},['FOL 3D 视图（双重盖保护）']);
    return makeEl('svg',{viewBox:'0 0 '+svgW+' '+svgH,xmlns:'http://www.w3.org/2000/svg',style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;'},[parts]);
  }

  // ============================================================
  //  TEL 展开图（套盖纸箱，盖子分离式）
  // ============================================================
  function makeUnfoldSVG_TEL(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 380;
    var scale = 0.40;
    var ox = 40, oy = 50;
    var BW = Math.round(L * scale), BH = Math.round(H * scale), lidH = Math.round((H+60) * scale);
    var parts = '';

    // 箱体展开
    parts += rectWithText(ox, oy + lidH + 20, BW, BH, '\u7BB1\u4F53\u4E3B\u4F53', '#C8A97A', '#5C4033', { shadow:true, fontSize:13 });
    // 盖子展开（上方分离）
    parts += rectWithText(ox, oy, BW, lidH, '\u76D6\u5B50\uFF08\u5957\u5408\u5F0F\uFF09', '#D4B896', '#FF9500', { stroke:'#FF9500', strokeWidth:1.5, 'stroke-dasharray':'6,3', fontSize:13 });
    // 套合箭头
    var ax2 = ox + BW/2, ay1 = oy + lidH + 10, ay2 = oy + lidH + 20;
    parts += makeEl('line', { x1:ax2, y1:ay1, x2:ax2, y2:ay2, stroke:'#34C759', 'stroke-width':2 });
    parts += makeEl('polygon', { points: (ax2-5)+','+(ay1+3)+' '+ax2+','+ay1+' '+(ax2+5)+','+(ay1+3), fill:'#34C759' });

    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['TEL 展开图（箱体+盖子分离）']);
    parts += makeEl('text', { x:svgW/2, y:40, fill:'#34C759', 'font-size':11, 'text-anchor':'middle' }, ['\u2193 \u76D6\u5B50\u5957\u5408\u5728\u7BB1\u4F53\u5916\u90E8']);
    parts += dimLine(ox, oy + lidH + 20 + BH + 35, ox + BW, oy + lidH + 20 + BH + 35, 'L\u00D7W='+L+'\u00D7'+(Math.round(BW/scale)), { color:'#E84923' });
    parts += dimLine(ox - 35, oy + lidH + 20, ox - 35, oy + lidH + 20 + BH, 'H='+H+unit, { color:'#007AFF' });
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_TEL(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW/2, oy = 55;
    var s = 0.45, ax = 0.866, ay = 0.5;
    function iso(x,y,z){ return {x:ox+(x-z)*ax*s, y:oy+(y+(x+z)*ay*s)}; }
    var c1='#C8A97A',c2='#B89B6E',cLid='#D4B896';
    var p={b1:iso(0,0,0),b2:iso(L,0,0),b3:iso(L,0,W),b4:iso(0,0,W),
           t1:iso(0,H,0),t2:iso(L,H,0),t3:iso(L,H,W),t4:iso(0,H,W)};
    var pl={t1:iso(-5,H-2,-5),t2:iso(L+5,H-2,-5),t3:iso(L+5,H-2,W+5),t4:iso(-5,H-2,W+5)};
    var parts='';
    parts+=makeEl('polygon',{points:p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+p.t3.x+','+p.t3.y+' '+p.t2.x+','+p.t2.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t3.x+','+p.t3.y,fill:c2,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    // 盖子（套在上面）
    parts+=makeEl('polygon',{points:pl.t1.x+','+pl.t1.y+' '+pl.t2.x+','+pl.t2.y+' '+pl.t3.x+','+pl.t3.y+' '+pl.t4.x+','+pl.t4.y,fill:cLid,stroke:'#FF9500','stroke-width':1.2,opacity:0.85});
    parts+=makeEl('text',{x:svgW/2,y:22,fill:'#1D1D1F','font-size':13,'font-weight':'700','text-anchor':'middle'},['TEL 3D 视图（套盖式）']);
    return makeEl('svg',{viewBox:'0 0 '+svgW+' '+svgH,xmlns:'http://www.w3.org/2000/svg',style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;'},[parts]);
  }

  // ============================================================
  //  FOLDR 展开图（折叠纸箱，平板运输）
  // ============================================================
  function makeUnfoldSVG_FOLDR(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 40;
    var pw = svgW - pad*2, ph = svgH - pad*2 - 40;
    var parts = '';

    parts += makeEl('rect', { x:pad, y:pad, width:pw, height:ph, fill:'#C8A97A', stroke:'#34C759', 'stroke-width':1.5, 'stroke-dasharray':'8,4', rx:4 });
    parts += makeEl('text', { x:pad+pw/2, y:pad+ph/2-10, fill:'#34C759', 'font-size':13, 'font-weight':'600', 'text-anchor':'middle', 'dominant-baseline':'middle' }, ['\u5E73\u677F\u72B6\u6001\uFF08\u8FD0\u8F93\u4E2D\uFF09']);
    parts += makeEl('text', { x:pad+pw/2, y:pad+ph/2+10, fill:'#5C4033', 'font-size':11, 'text-anchor':'middle', 'dominant-baseline':'middle' }, ['\u538B\u75D5\u7EBF\u6298\u53E0 \u2192 \u81EA\u52A8\u6210\u578B']);

    // 折痕线网格
    var rows = 3, cols = 4;
    var cw = pw / cols, ch = ph / rows;
    for (var r = 1; r < rows; r++) {
      parts += foldLine(pad, pad + r*ch, pad + pw, pad + r*ch, '#007AFF');
    }
    for (var c = 1; c < cols; c++) {
      parts += foldLine(pad + c*cw, pad, pad + c*cw, pad + ph, '#007AFF');
    }

    // 折叠方向箭头
    parts += makeEl('line', { x1:pad+pw+20, y1:pad+ph/2, x2:pad+pw+55, y2:pad+ph/2, stroke:'#007AFF', 'stroke-width':2, 'marker-end':'url(#arrowFold)' });
    parts += makeEl('defs', {}, [makeEl('marker', { id:'arrowFold', markerWidth:8, markerHeight:6, refX:8, refY:3, orient:'auto' }, [
      makeEl('polygon', { points:'0,0 8,3 0,6', fill:'#007AFF' })
    ])]);
    parts += makeEl('text', { x:pad+pw+60, y:pad+ph/2+4, fill:'#007AFF', 'font-size':11, 'font-weight':'600' }, ['\u6298\u53E0']);

    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['FOLDR \u5C55\u5F00\u56FE\uFF08\u5E73\u677F\u8FD0\u8F93 \u2192 \u6298\u53E0\u6210\u578B\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_FOLDR(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW/2, oy = 55;
    var s = 0.45, ax = 0.866, ay = 0.5;
    function iso(x,y,z){ return {x:ox+(x-z)*ax*s, y:oy+(y+(x+z)*ay*s)}; }
    var c1='#C8A97A',c2='#B89B6E';
    var p={b1:iso(0,0,0),b2:iso(L,0,0),b3:iso(L,0,W),b4:iso(0,0,W),
           t1:iso(0,H,0),t2:iso(L,H,0),t3:iso(L,H,W),t4:iso(0,H,W)};
    var parts='';
    parts+=makeEl('polygon',{points:p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+p.t3.x+','+p.t3.y+' '+p.t2.x+','+p.t2.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t3.x+','+p.t3.y,fill:c2,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y,fill:'#FAF8F5',stroke:'#7A6345','stroke-width':0.8,opacity:0.6});
    parts+=makeEl('line',{x1:p.t1.x,y1:p.t1.y,x2:p.t4.x,y2:p.t4.y,stroke:'#34C759','stroke-width':1.2,'stroke-dasharray':'3,3'});
    parts+=makeEl('text',{x:svgW/2,y:22,fill:'#1D1D1F','font-size':13,'font-weight':'700','text-anchor':'middle'},['FOLDR 3D 视图（折叠成型，顶部开口）']);
    return makeEl('svg',{viewBox:'0 0 '+svgW+' '+svgH,xmlns:'http://www.w3.org/2000/svg',style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;'},[parts]);
  }

  // ============================================================
  //  DC 展开图（模切纸箱，异形冲切）
  // ============================================================
  function makeUnfoldSVG_DC(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 40;
    var bw = svgW - pad*2, bh = svgH - pad*2 - 40;
    var parts = '';

    parts += makeEl('rect', { x:pad, y:pad, width:bw, height:bh, fill:'#C8A97A', stroke:'#E84923', 'stroke-width':2, rx:20 });
    // 锁扣位置
    var cx = pad + bw/2, cy = pad + bh;
    parts += makeEl('polygon', { points: (cx-10)+','+cy+' '+(cx+10)+','+cy+' '+cx+','+(cy+16), fill:'#FF9500', opacity:0.7 });
    parts += makeEl('text', { x:cx, y:cy+28, fill:'#FF9500', 'font-size':10, 'text-anchor':'middle' }, ['\u9501\u6263']);
    // 提手孔
    parts += makeEl('circle', { cx:pad+bw/2, cy:pad+bh*0.3, r:14, fill:'none', stroke:'#007AFF', 'stroke-width':1.5, 'stroke-dasharray':'4,2' });
    parts += makeEl('text', { x:pad+bw/2, y:pad+bh*0.3+20, fill:'#007AFF', 'font-size':10, 'text-anchor':'middle' }, ['\u63D0\u624B\u5B54']);
    // 模切刀线
    parts += makeEl('rect', { x:pad+6, y:pad+6, width:bw-12, height:bh-12, fill:'none', stroke:'#E84923', 'stroke-width':1, rx:16 });

    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['DC \u6A21\u5207\u5C55\u5F00\u56FE\uFF08\u5F02\u5F62\u51B2\u5207\uFF09']);
    parts += makeEl('text', { x:svgW/2, y:40, fill:'#E84923', 'font-size':11, 'text-anchor':'middle' }, ['\u7EA2\u8272\u5B9E\u7EBF = \u6A21\u5207\u5200\u7EBF\uFF08\u4E00\u5200\u6210\u578B\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_DC(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW/2, oy = 55;
    var s = 0.45, ax = 0.866, ay = 0.5;
    function iso(x,y,z){ return {x:ox+(x-z)*ax*s, y:oy+(y+(x+z)*ay*s)}; }
    var c1='#C8A97A',c2='#B89B6E';
    var p={b1:iso(0,0,0),b2:iso(L,0,0),b3:iso(L,0,W),b4:iso(0,0,W),
           t1:iso(0,H,0),t2:iso(L,H,0),t3:iso(L,H,W),t4:iso(0,H,W)};
    var parts='';
    parts+=makeEl('polygon',{points:p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+p.t3.x+','+p.t3.y+' '+p.t2.x+','+p.t2.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t3.x+','+p.t3.y,fill:c2,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    // 锁扣（顶部小凸起）
    var lx=(p.t1.x+p.t2.x)/2, ly=p.t1.y-10;
    parts+=makeEl('rect',{x:lx-8,y:ly-4,width:16,height:8,rx:2,fill:'#FF9500',opacity:0.7});
    parts+=makeEl('text',{x:svgW/2,y:22,fill:'#1D1D1F','font-size':13,'font-weight':'700','text-anchor':'middle'},['DC 3D 视图（自带锁扣，无需胶带）']);
    return makeEl('svg',{viewBox:'0 0 '+svgW+' '+svgH,xmlns:'http://www.w3.org/2000/svg',style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;'},[parts]);
  }

  // ============================================================
  //  BLS 展开图（布利斯纸箱，三片式）
  // ============================================================
  function makeUnfoldSVG_BLS(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 30;
    var bw = (svgW - pad*2) / 3 - 10;
    var bh = svgH - pad*2 - 60;
    var parts = '';

    // 主体
    parts += rectWithText(pad + bw + 10, pad + 40, bw*3 + 20, bh, '\u4E3B\u4F53\uFF08\u4E00\u7247\u5F0F\uFF09', '#C8A97A', '#5C4033', { shadow:true, fontSize:12 });
    // 左端板
    parts += rectWithText(pad - 5, pad + 40 + 20, bw, bh - 40, '\u5DE6\u7AEF\u677F', '#D4B896', '#007AFF', { stroke:'#007AFF', strokeWidth:1.5, 'stroke-dasharray':'6,3', fontSize:11 });
    // 右端板
    parts += rectWithText(pad + bw*4 + 15, pad + 40 + 20, bw, bh - 40, '\u53F3\u7AEF\u677F', '#D4B896', '#007AFF', { stroke:'#007AFF', strokeWidth:1.5, 'stroke-dasharray':'6,3', fontSize:11 });

    // 插槽连接示意
    parts += makeEl('line', { x1:pad + bw + 10, y1:pad + 40 + bh/2, x2:pad + bw + 5, y2:pad + 40 + bh/2, stroke:'#34C759', 'stroke-width':2 });
    parts += makeEl('text', { x:pad + bw + 5, y:pad + 40 + bh/2 - 8, fill:'#34C759', 'font-size':10, 'text-anchor':'end' }, ['\u63D2\u69FD\u8FDE\u63A5']);

    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['BLS \u5C55\u5F00\u56FE\uFF08\u4E09\u7247\u5F0F\uFF1A\u4E3B\u4F53+\u4E24\u7AEF\u677F\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_BLS(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW/2, oy = 55;
    var s = 0.45, ax = 0.866, ay = 0.5;
    function iso(x,y,z){ return {x:ox+(x-z)*ax*s, y:oy+(y+(x+z)*ay*s)}; }
    var c1='#C8A97A',c2='#B89B6E',c3='#A88B5E';
    var p={b1:iso(0,0,0),b2:iso(L,0,0),b3:iso(L,0,W),b4:iso(0,0,W),
           t1:iso(0,H,0),t2:iso(L,H,0),t3:iso(L,H,W),t4:iso(0,H,W)};
    var parts='';
    parts+=makeEl('polygon',{points:p.b1.x+','+p.b1.y+' '+p.b2.x+','+p.b2.y+' '+p.t2.x+','+p.t2.y+' '+p.t1.x+','+p.t1.y,fill:c3,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t3.x+','+p.t3.y,fill:c3,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+p.t3.x+','+p.t3.y+' '+p.t2.x+','+p.t2.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('text',{x:svgW/2,y:22,fill:'#1D1D1F','font-size':13,'font-weight':'700','text-anchor':'middle'},['BLS 3D 视图（无摇盖，抗压最强）']);
    return makeEl('svg',{viewBox:'0 0 '+svgW+' '+svgH,xmlns:'http://www.w3.org/2000/svg',style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;'},[parts]);
  }

  // ============================================================
  //  剩余类型的 SVG 生成器（TRY / RETF / CTRY / CSSC / DCB / FPF / PWB / SLB）
  //  使用通用模板，后续可逐个细化
  // ============================================================

  // --- TRY 托盘式 ---
  function makeUnfoldSVG_TRY(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 40, ox = pad, oy = 70;
    var bw = svgW - pad*2, bh = svgH - 140;
    var parts = '';
    parts += rectWithText(ox, oy + bh*0.3, bw, bh*0.7, '', '#C8A97A', '#333', { shadow:true });
    parts += makeEl('text', { x:ox+bw/2, y:oy+bh*0.3+bh*0.35, fill:'#5C4033', 'font-size':13, 'font-weight':'600', 'text-anchor':'middle', 'dominant-baseline':'middle' }, ['\u6258\u76D8\u4E3B\u4F53\uFF08\u65E0\u9876\u76D6\uFF09']);
    parts += foldLine(ox, oy+bh*0.3, ox+bw, oy+bh*0.3, '#007AFF');
    parts += makeEl('line', { x1:ox, y1:oy+bh*0.3-20, x2:ox, y2:oy+bh*0.3, stroke:'#34C759', 'stroke-width':2, 'marker-end':'url(#atry)' });
    parts += makeEl('defs', {}, [makeEl('marker', { id:'atry', markerWidth:6, markerHeight:6, refX:6, refY:3 }, [
      makeEl('polygon', { points:'0,0 6,3 0,6', fill:'#34C759' })
    ])]);
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['TRY \u5C55\u5F00\u56FE\uFF08\u6258\u76D8\u5F0F\uFF0C\u56DB\u58C1\u53EF\u6298\u53E0\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_TRY(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW/2, oy = 55;
    var s = 0.45, ax = 0.866, ay = 0.5;
    function iso(x,y,z){ return {x:ox+(x-z)*ax*s, y:oy+(y+(x+z)*ay*s)}; }
    var c1='#C8A97A',c2='#B89B6E';
    var p={b1:iso(0,0,0),b2:iso(L,0,0),b3:iso(L,0,W),b4:iso(0,0,W)};
    var parts='';
    // 只画侧壁（无顶盖）
    parts+=makeEl('polygon',{points:p.b1.x+','+p.b1.y+' '+p.b2.x+','+p.b2.y+' '+(p.b2.x)+','+(p.b2.y-H*0.5)+' '+(p.b1.x)+','+(p.b1.y-H*0.5),fill:c2,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+(p.b4.x)+','+(p.b4.y-H*0.5)+' '+(p.b3.x)+','+(p.b3.y-H*0.5),fill:c2,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b1.x+','+p.b1.y+' '+p.b4.x+','+p.b4.y+' '+(p.b4.x)+','+(p.b4.y-H*0.5)+' '+(p.b1.x)+','+(p.b1.y-H*0.5),fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+(p.b3.x)+','+(p.b3.y-H*0.5)+' '+(p.b2.x)+','+(p.b2.y-H*0.5),fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('text',{x:svgW/2,y:22,fill:'#1D1D1F','font-size':13,'font-weight':'700','text-anchor':'middle'},['TRY 3D 视图（开放式托盘，无顶盖）']);
    return makeEl('svg',{viewBox:'0 0 '+svgW+' '+svgH,xmlns:'http://www.w3.org/2000/svg',style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;'},[parts]);
  }

  // --- RETF 自锁纸箱（前插式）---
  function makeUnfoldSVG_RETF(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 40, ox = pad, oy = 70;
    var bw = svgW - pad*2, bh = svgH - 140;
    var parts = '';
    parts += rectWithText(ox, oy + 40, bw, bh, '', '#C8A97A', '#333', { shadow:true });
    // 插舌
    var cx = ox + bw/2, cy = oy + 40 + bh - 10;
    parts += makeEl('polygon', { points: (cx-12)+','+cy+' '+(cx+12)+','+cy+' '+cx+','+(cy+18), fill:'#E84923', opacity:0.7 });
    parts += makeEl('text', { x:cx, y:cy+30, fill:'#E84923', 'font-size':10, 'text-anchor':'middle' }, ['\u81EA\u9501\u63D2\u820C']);
    // 锁孔
    parts += makeEl('circle', { cx:cx, cy:oy+40+20, r:6, fill:'none', stroke:'#007AFF', 'stroke-width':1.5 });
    parts += makeEl('text', { x:cx, y:oy+40+35, fill:'#007AFF', 'font-size':10, 'text-anchor':'middle' }, ['\u9501\u5B54']);
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['RETF \u5C55\u5F00\u56FE\uFF08\u63D2\u820C+\u9501\u5B54\u81EA\u9501\u7ED3\u6784\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_RETF(L, W, H, unit) {
    // 外观类似 RSC，但底部有锁扣
    return make3DSVG_RSC(L, W, H, unit).replace('3D 折叠视图', '3D 视图（自锁底，无需胶带封底）').replace('RSC 3D','RETF 3D');
  }

  // --- CTRY 角撑托盘 ---
  function makeUnfoldSVG_CTRY(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 40, ox = pad, oy = 70;
    var bw = svgW - pad*2, bh = svgH - 140;
    var parts = '';
    parts += rectWithText(ox, oy + 40, bw, bh, '', '#C8A97A', '#333', { shadow:true });
    // 角撑（四角三角形加固）
    var s = 20;
    parts += makeEl('polygon', { points:ox+','+(oy+40)+' '+(ox+s)+','+(oy+40)+' '+ox+','+(oy+40+s), fill:'#FF9500', opacity:0.5 });
    parts += makeEl('polygon', { points:(ox+bw)+','+(oy+40)+' '+(ox+bw-s)+','+(oy+40)+' '+(ox+bw)+','+(oy+40+s), fill:'#FF9500', opacity:0.5 });
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['CTRY \u5C55\u5F00\u56FE\uFF08\u56DB\u89D2\u4E09\u89D2\u5F62\u52A0\u56FA\uFF09']);
    parts += makeEl('text', { x:svgW/2, y:40, fill:'#FF9500', 'font-size':11, 'text-anchor':'middle' }, ['\u26A0 \u6A59\u8272\u4E09\u89D2\u5F62 = \u89D2\u6491\u52A0\u56FA\u7247']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_CTRY(L, W, H, unit) {
    // 类似托盘，但角部有加固
    return make3DSVG_TRY(L, W, H, unit);
  }

  // --- CSSC 中缝开槽纸箱 ---
  function makeUnfoldSVG_CSSC(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var scale = 0.42;
    var ox = 40, oy = 70;
    var LW = Math.round(L * scale), WW = Math.round(W * scale), HH = Math.round(H * scale);
    var parts = '';

    parts += rectWithText(ox + HH, oy, LW, WW, '', '#C8A97A', '#333', { shadow:true });
    parts += rectWithText(ox, oy, HH, WW, '', '#C8A97A', '#333');
    parts += rectWithText(ox + HH + LW, oy, HH, WW, '', '#C8A97A', '#333');
    // 中缝线（加粗）
    parts += makeEl('line', { x1:ox+HH+LW/2, y1:oy-10, x2:ox+HH+LW/2, y2:oy+WW+10, stroke:'#FF9500', 'stroke-width':2.5 });
    parts += makeEl('text', { x:ox+HH+LW/2, y:oy-16, fill:'#FF9500', 'font-size':10, 'font-weight':'600', 'text-anchor':'middle' }, ['\u4E2D\u7F1D\u7EBF']);

    parts += foldLine(ox + HH, oy, ox + HH, oy + WW);
    parts += foldLine(ox + HH + LW, oy, ox + HH + LW, oy + WW);

    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['CSSC \u5C55\u5F00\u56FE\uFF08\u4E2D\u7F1D\u5BF9\u79F0\u8BBE\u8BA1\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_CSSC(L, W, H, unit) {
    return make3DSVG_RSC(L, W, H, unit);
  }

  // --- DCB 双盖纸箱 ---
  function makeUnfoldSVG_DCB(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 380;
    var pad = 40, ox = pad, oy = 40;
    var bw = svgW - pad*2, bh = svgH - 180;
    var parts = '';
    // 箱体
    parts += rectWithText(ox + 60, oy + 60, bw - 120, bh, '\u7BB1\u4F53\u4E3B\u4F53', '#C8A97A', '#5C4033', { shadow:true, fontSize:12 });
    // 顶盖
    parts += rectWithText(ox + 60, oy, bw - 120, 50, '\u9876\u76D6\uFF08\u53EF\u5206\u79BB\uFF09', '#D4B896', '#E84923', { stroke:'#E84923', strokeWidth:1.5, 'stroke-dasharray':'6,3', fontSize:11 });
    // 底盖
    parts += rectWithText(ox + 60, oy + bh + 60, bw - 120, 50, '\u5E95\u76D6\uFF08\u53EF\u5206\u79BB\uFF09', '#D4B896', '#E84923', { stroke:'#E84923', strokeWidth:1.5, 'stroke-dasharray':'6,3', fontSize:11 });
    // 套合箭头
    parts += makeEl('line', { x1:svgW/2, y1:oy+50, x2:svgW/2, y2:oy+58, stroke:'#34C759', 'stroke-width':2 });
    parts += makeEl('polygon', { points: (svgW/2-5)+','+(oy+53)+' '+svgW/2+','+(oy+50)+' '+(svgW/2+5)+','+(oy+53), fill:'#34C759' });
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['DCB \u5C55\u5F00\u56FE\uFF08\u9876\u76D6+\u5E95\u76D6\u53CC\u5206\u79BB\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_DCB(L, W, H, unit) {
    return make3DSVG_TEL(L, W, H, unit);
  }

  // --- FPF 五面板折叠箱 ---
  function makeUnfoldSVG_FPF(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 30, ox = pad;
    var pw = (svgW - pad*2) / 5;
    var ph = svgH - pad*2 - 40;
    var parts = '';
    for (var i = 0; i < 5; i++) {
      parts += rectWithText(ox + i*pw, pad + 40, pw - 4, ph, 'P'+(i+1), (i%2===0?'#C8A97A':'#D4B896'), '#5C4033', { stroke:'#7A6345', strokeWidth:1, fontSize:11 });
    }
    for (var r = 0; r < 4; r++) {
      parts += foldLine(ox + (r+1)*pw - 2, pad + 40, ox + (r+1)*pw - 2, pad + 40 + ph, '#007AFF');
    }
    parts += makeEl('line', { x1:ox+pw*5+20, y1:pad+40+ph/2, x2:ox+pw*5+55, y2:pad+40+ph/2, stroke:'#007AFF', 'stroke-width':2, 'marker-end':'url(#afpf)' });
    parts += makeEl('defs', {}, [makeEl('marker', { id:'afpf', markerWidth:6, markerHeight:6, refX:6, refY:3 }, [
      makeEl('polygon', { points:'0,0 6,3 0,6', fill:'#007AFF' })
    ])]);
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['FPF \u5C55\u5F00\u56FE\uFF08P1\u2192P5 \u4F9D\u6B21\u6298\u53E0\u5305\u88F9\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_FPF(L, W, H, unit) {
    return make3DSVG_RSC(L, W, H, unit);
  }

  // --- PWB 垫纸包裹箱 ---
  function makeUnfoldSVG_PWB(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 40, ox = pad, oy = 50;
    var bw = svgW - pad*2, bh = svgH - 140;
    var parts = '';
    parts += rectWithText(ox, oy + 40, bw, bh, '\u5355\u7247\u7EB8\u677F\uFF08\u5305\u88F9\u5F0F\uFF09', '#C8A97A', '#5C4033', { shadow:true, fontSize:13 });
    // 折叠箭头
    var cy = oy + 40 + bh/2;
    parts += makeEl('line', { x1:ox-20, y1:cy, x2:ox, y2:cy, stroke:'#007AFF', 'stroke-width':2, 'marker-end':'url(#apwb)' });
    parts += makeEl('defs', {}, [makeEl('marker', { id:'apwb', markerWidth:6, markerHeight:6, refX:6, refY:3 }, [
      makeEl('polygon', { points:'0,0 6,3 0,6', fill:'#007AFF' })
    ])]);
    parts += makeEl('line', { x1:ox+bw+20, y1:cy, x2:ox+bw, y2:cy, stroke:'#007AFF', 'stroke-width':2, 'marker-start':'url(#apwb2)' });
    parts += makeEl('defs', {}, [makeEl('marker', { id:'apwb2', markerWidth:6, markerHeight:6, refX:0, refY:3, orient:'auto' }, [
      makeEl('polygon', { points:'6,0 0,3 6,6', fill:'#007AFF' })
    ])]);
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['PWB \u5C55\u5F00\u56FE\uFF08\u5355\u7247\u5F0F\uFF0C\u6298\u53E0\u5305\u88F9\u6210\u578B\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_PWB(L, W, H, unit) {
    var svgW = 520, svgH = 460;
    var ox = svgW/2 - 60, oy = 55;
    var parts = '';
    parts += makeEl('polygon', { points:ox+','+(oy+20)+' '+(ox+120)+','+oy+' '+(ox+120)+','+(oy+80)+' '+(ox)+','+(oy+60), fill:'#C8A97A', stroke:'#7A6345', 'stroke-width':1.5 });
    parts += makeEl('polygon', { points:ox+','+(oy+20)+' '+(ox+120)+','+oy+' '+(ox+120)+','+(oy+30), fill:'#D4B896', stroke:'#7A6345', 'stroke-width':1, opacity:0.7 });
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['PWB 3D 视图（包裹式，无粘接）']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  // --- SLB 自锁底纸箱 ---
  function makeUnfoldSVG_SLB(L, W, H, unit) {
    unit = unit || 'mm';
    var svgW = 520, svgH = 340;
    var pad = 40, ox = pad, oy = 50;
    var bw = svgW - pad*2, bh = svgH - 140;
    var parts = '';
    parts += rectWithText(ox, oy + 40, bw, bh, '', '#C8A97A', '#333', { shadow:true });
    // 底部自锁结构
    var cx = ox + bw/2, cy = oy + 40 + bh/2;
    parts += makeEl('line', { x1:cx-30, y1:cy, x2:cx+30, y2:cy, stroke:'#34C759', 'stroke-width':2 });
    parts += makeEl('line', { x1:cx, y1:cy-20, x2:cx, y2:cy+20, stroke:'#34C759', 'stroke-width':2 });
    parts += makeEl('text', { x:cx, y:cy+35, fill:'#34C759', 'font-size':11, 'font-weight':'600', 'text-anchor':'middle' }, ['\u5E95\u90E8\u81EA\u9501\u7ED3\u6784\uFF08\u6309\u538B\u81EA\u52A8\u9501\u7D27\uFF09']);
    // 顶部普通摇盖
    parts += rectWithText(ox + bw/2 - 40, oy + 30, 80, 20, '', '#D4B896', '#666', { stroke:'#7A6345', strokeWidth:1 });
    parts += makeEl('text', { x:svgW/2, y:22, fill:'#1D1D1F', 'font-size':13, 'font-weight':'700', 'text-anchor':'middle' }, ['SLB \u5C55\u5F00\u56FE\uFF08\u5E95\u90E8\u81EA\u9501\uFF0C\u9876\u90E8\u5E38\u89C4\uFF09']);
    return makeEl('svg', { viewBox:'0 0 ' + svgW + ' ' + svgH, xmlns:'http://www.w3.org/2000/svg', style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;' }, [parts]);
  }

  function make3DSVG_SLB(L, W, H, unit) {
    unit = unit || '';
    var svgW = 520, svgH = 460;
    var ox = svgW/2, oy = 55;
    var s = 0.45, ax = 0.866, ay = 0.5;
    function iso(x,y,z){ return {x:ox+(x-z)*ax*s, y:oy+(y+(x+z)*ay*s)}; }
    var c1='#C8A97A',c2='#B89B6E';
    var p={b1:iso(0,0,0),b2:iso(L,0,0),b3:iso(L,0,W),b4:iso(0,0,W),
           t1:iso(0,H,0),t2:iso(L,H,0),t3:iso(L,H,W),t4:iso(0,H,W)};
    var parts='';
    parts+=makeEl('polygon',{points:p.b2.x+','+p.b2.y+' '+p.b3.x+','+p.b3.y+' '+p.t3.x+','+p.t3.y+' '+p.t2.x+','+p.t2.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.b3.x+','+p.b3.y+' '+p.b4.x+','+p.b4.y+' '+p.t4.x+','+p.t4.y+' '+p.t3.x+','+p.t3.y,fill:c2,stroke:'#7A6345','stroke-width':0.8});
    parts+=makeEl('polygon',{points:p.t1.x+','+p.t1.y+' '+p.t2.x+','+p.t2.y+' '+p.t3.x+','+p.t3.y+' '+p.t4.x+','+p.t4.y,fill:c1,stroke:'#7A6345','stroke-width':0.8});
    // 底部自锁示意
    var lx=(p.b1.x+p.b2.x)/2, ly=p.b1.y-8;
    parts+=makeEl('rect',{x:lx-8,y:ly-4,width:16,height:8,rx:2,fill:'#34C759',opacity:0.7});
    parts+=makeEl('text',{x:svgW/2,y:22,fill:'#1D1D1F','font-size':13,'font-weight':'700','text-anchor':'middle'},['SLB 3D 视图（底部自锁，无需胶带封底）']);
    return makeEl('svg',{viewBox:'0 0 '+svgW+' '+svgH,xmlns:'http://www.w3.org/2000/svg',style:'background:#FAF8F5;border-radius:8px;width:100%;height:auto;'},[parts]);
  }

  // ============================================================
  //  默认尺寸表（示意值，单位 mm）
  // ============================================================
  var DEFAULT_DIMS = {
    rsc:  { L:300, W:200, H:150 },
    hsc:  { L:300, W:200, H:150 },
    fol:  { L:350, W:220, H:180 },
    tel:  { L:280, W:180, H:100 },
    foldr: { L:250, W:180, H:80 },
    dc:   { L:280, W:200, H:120 },
    bls:  { L:400, W:300, H:200 },
    try:  { L:350, W:250, H:60 },
    retf:  { L:300, W:200, H:150 },
    ctry: { L:320, W:220, H:120 },
    cssc: { L:300, W:200, H:150 },
    dcb:  { L:320, W:220, H:160 },
    fpf:  { L:400, W:150, H:100 },
    pwb:  { L:350, W:250, H:30 },
    slb:  { L:300, W:200, H:150 }
  };

  // 生成器映射表
  var GENERATORS = {
    rsc:   { unfold:makeUnfoldSVG_RSC,  fold:make3DSVG_RSC },
    hsc:   { unfold:makeUnfoldSVG_HSC,  fold:make3DSVG_HSC },
    fol:   { unfold:makeUnfoldSVG_FOL,  fold:make3DSVG_FOL },
    tel:   { unfold:makeUnfoldSVG_TEL,  fold:make3DSVG_TEL },
    foldr: { unfold:makeUnfoldSVG_FOLDR, fold:make3DSVG_FOLDR },
    dc:    { unfold:makeUnfoldSVG_DC,   fold:make3DSVG_DC },
    bls:   { unfold:makeUnfoldSVG_BLS,  fold:make3DSVG_BLS },
    try:   { unfold:makeUnfoldSVG_TRY,  fold:make3DSVG_TRY },
    retf:  { unfold:makeUnfoldSVG_RETF, fold:make3DSVG_RETF },
    ctry:  { unfold:makeUnfoldSVG_CTRY, fold:make3DSVG_CTRY },
    cssc:  { unfold:makeUnfoldSVG_CSSC, fold:make3DSVG_CSSC },
    dcb:   { unfold:makeUnfoldSVG_DCB,  fold:make3DSVG_DCB },
    fpf:   { unfold:makeUnfoldSVG_FPF,  fold:make3DSVG_FPF },
    pwb:   { unfold:makeUnfoldSVG_PWB,  fold:make3DSVG_PWB },
    slb:   { unfold:makeUnfoldSVG_SLB,  fold:make3DSVG_SLB }
  };

  // ============================================================
  //  主入口：挂载到 WikiS 对象
  // ============================================================
  // 禁用 SVG 生成（改用图片上传功能）
  function getCartonSVGs(id) {
    return {
      unfold: '',
      fold: ''
    };
  }

  // 挂载
  if (typeof WikiS !== 'undefined') {
    WikiS.getCartonSVGs = getCartonSVGs;
  }

})();
