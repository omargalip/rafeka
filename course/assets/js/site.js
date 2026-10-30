/* روابط عامة */
(function () {
  'use strict';
  var COURSE = 'كورس التصميم باستخدام Adobe والذكاء الاصطناعي';
  var PHONE = '905364886676';
  var link = document.getElementById('wa-bottom');
  if (link) {
    link.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent('مرحبا أستاذ عمر، بدي احجز مقعد بالفوج المسائي (من 9 لـ 11 بالليل) ب' + COURSE + ' (يبدأ 15 نوفمبر).');
  }
})();
