const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// The news renderer lives in assets/js/render.js (an ES module shared by the home and News pages).
(async () => {
const { newsParagraphs } = await import(pathToFileURL(path.join(__dirname, '../assets/js/render.js')).href);
const render = content => newsParagraphs(content);
assert.equal(render(['첫째 줄', '둘째 줄']), '<p>첫째 줄<br>둘째 줄</p>');
assert.equal(render(['첫째 줄', '', '셋째 줄']), '<p>첫째 줄<br><br>셋째 줄</p>');
assert.equal(render(['A\nB', 'C\r\nD']), '<p>A<br>B<br>C<br>D</p>');
assert.equal(render('A\n\nB'), '<p>A<br><br>B</p>');
assert.equal(render(['**볼드**와 *이탤릭*']), '<p><strong>볼드</strong>와 <em>이탤릭</em></p>');
assert.equal(render('***둘 다***'), '<p><strong><em>둘 다</em></strong></p>');
assert.equal(render('**굵게 *내부 기울임* 끝**'), '<p><strong>굵게 <em>내부 기울임</em> 끝</strong></p>');
assert.equal(render('닫히지 않은 **표시'), '<p>닫히지 않은 **표시</p>');
assert.equal(render('**<img src=x onerror=alert(1)>** & *<script>*'), '<p><strong>&lt;img src=x onerror=alert(1)&gt;</strong> &amp; <em>&lt;script&gt;</em></p>');
assert.equal(render('**A\nB**'), '<p>**A<br>B**</p>');
assert.equal(render([]), '');
assert.equal(render(null), '');
console.log('News formatting: 12 checks passed');
})().catch(error => { console.error(error); process.exit(1); });
