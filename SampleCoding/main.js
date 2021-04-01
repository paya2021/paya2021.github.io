/**
 * -------------------------------
 * vue.js（データバインディング）
 * -------------------------------
 */
const app = new Vue({
  el: '#example',
  data: {
    inputContents: '',
  },
});

/**
 * -------------------------------
 * 情報取得
 * -------------------------------
 */
const getImage = () => {

  // Dog APIのURL
  const url = 'https://dog.ceo/api/breeds/image/random';

  // 画像を取得
  $.getJSON(url, (data) => {

    // データが取得できなかった場合
    if (data.status !== 'success') {
      console.error('データの取得に失敗しました。');
      return;
    }

    // imgタグに設定
    $('#dog').attr({
      'src': data.message
    });
  });
};

setInterval(getImage, 3000);

/**
 * -------------------------------
 * モーダルウィンドウ
 * -------------------------------
 */
$(function () {
  $('#openModal').click(function(){
    $('#modalArea').fadeIn();
  });
  $('#closeModal , #modalBg').click(function(){
    $('#modalArea').fadeOut();
  });
});

/**
 * -------------------------------
 * スライドメニュー
 * -------------------------------
 */
$(function() {
  $('#openSlideMenu').click(function() {

    $('.slideMenuList').animate( { width: 'toggle' }, 'slow' );

    if ($(this).hasClass('open')) {
      $(this).removeClass('open');
      $('#openSlideMenu').text('OPEN SLIDE NEMU');

      $('#openSlideMenu').animate({
        'marginLeft': '0px'
      });

    } else {
      $(this).addClass('open');
      $('#openSlideMenu').text('CLOSE SLIDE NEMU');
      $('#openSlideMenu').animate({
        'marginLeft': '200px'
      });
    }
  });
});

/**
 * -------------------------------
 * ツールチップ
 * -------------------------------
 */
$('[data-toggle="tooltip"]').tooltip();

/**
 * -------------------------------
 * スクロール位置カレント表示
 * -------------------------------
 */
$(function() {
  var box_01 = Math.round($('#box_01').offset().top);
  var box_02 = Math.round($('#box_02').offset().top);
  var box_03 = Math.round($('#box_03').offset().top);
  var box_04 = Math.round($('#box_04').offset().top);

  $(window).on('scroll',function(){
    var posScroll = $(window).scrollTop() + 500;

    if (box_01 <= posScroll && posScroll < box_02) {
      $(".box-container > div").removeClass('current');
      $("#box_01").addClass('current');
    } else if (box_02 <= posScroll && posScroll < box_03) {
      $(".box-container > div").removeClass('current');
      $("#box_02").addClass('current');
    } else if (box_03 <= posScroll && posScroll < box_04) {
      $(".box-container > div").removeClass('current');
      $("#box_03").addClass('current');
    } else if (box_04 <= posScroll && posScroll) {
      $(".box-container > div").removeClass('current');
      $("#box_04").addClass('current');
    }
  });
});

/**
 * -------------------------------
 * 高解像度対応
 * -------------------------------
 */
$(window).on('load resize',function(){
  console.log('デバイスピクセル比：' + window.devicePixelRatio);
});
