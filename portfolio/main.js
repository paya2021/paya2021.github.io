/**
 * --------------------
 * テキストアニメーション
 * --------------------
 */
$(function () {
  $('.main-title').hide().each(function(i){
    // 遅延処理
    $(this).delay(i * 500).fadeIn('slow');
  });
});

/**
 * --------------------
 * ヘッダリンクのスムーズスクロール
 * --------------------
 */
$(function(){
  // #で始まるa要素をクリックした場合に処理
  $('a[href^=#]').click(function(){
    // 移動先-100px調整する。
    const adjust = -100;
    // スクロールの速度（ミリ秒）
    const speed = 400;
    // アンカーの値取得 リンク先（href）を取得して、hrefという変数に代入
    const href= $(this).attr("href");
    // 移動先を取得 リンク先(href）のidがある要素を探して、targetに代入
    const target = $(href == "#" || href == "" ? 'html' : href);
    // 移動先を調整 idの要素の位置をoffset()で取得して、positionに代入
    const position = target.offset().top + adjust;
    // スムーススクロール linear（等速） or swing（変速）
    $('body,html').animate({scrollTop:position}, speed, 'swing');
    return false;
  });
});
