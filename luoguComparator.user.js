// ==UserScript==
// @name         洛谷比较器
// @namespace    https://su226.github.io/
// @version      0.0.2
// @description  有对比才知道自己多蒻
// @author       su226
// @match        https://www.luogu.org/space/show?uid=*
// @grant        none
// ==/UserScript==
const diffIndex = Object.freeze({
  "尚无评定": 0,
  "入门难度": 1,
  "普及-": 2,
  "普及/提高-": 3,
  "普及+/提高": 4,
  "提高+/省选-": 5,
  "省选/NOI-": 6,
  "NOI/NOI+/CTSC": 7
});
const diffName = Object.freeze(["尚无评定", "入门难度", "普及-", "普及/提高-", "普及+/提高", "提高+/省选-", "省选/NOI-", "NOI/NOI+/CTSC"]);
const diffColor = Object.freeze(["gray", "red", "orange", "yellow", "green", "bluelight", "purple", "bluedark"]);
const permIndex = Object.freeze({
  "封禁账户": 0,
  "普通用户": 1,
  "特殊权限": 2,
  "管理员": 3,
  "超级管理员/Root": 4
});
const permName = Object.freeze(["封禁账户", "普通用户", "特殊权限", "管理员", "超级管理员/Root"]);
function parseBignum(a) {
  if (a[a.length - 1] == "K") {
    return parseFloat(a.substring(0, a.length - 1)) * 1000;
  } else if (a == "N/A") {
    return NaN;
  }
  return parseInt(a);
}
function toBignum(a) {
  if (a >= 1000) {
    return Math.round(a / 100) / 10 + "K";
  }
  return Math.round(a).toString();
}
function parseUser(doc) {
  let data = doc.querySelectorAll("span.lg-right");
  let ret = {
    username: doc.querySelector(".lg-toolbar h1").textContent.split(" ")[1],
    uid: parseInt(data[0].textContent),
    regTime: new Date(data[2].textContent.trim()),
    permission: permIndex[data[1].textContent]
  };
  let nums = doc.querySelectorAll(".lg-bignum-num");
  if (nums.length == 0) {
    Object.assign(ret, {
      submissions: NaN,
      accepted: NaN,
      rank: NaN,
      difficulty: [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]
    });
  } else {
    let difficulties = [0, 0, 0, 0, 0, 0, 0, 0];
    doc.querySelectorAll(".am-u-md-4 tr").forEach(e => {
      difficulties[diffIndex[e.children[0].children[0].textContent]] = parseInt(e.children[1].children[0].textContent);
    });
    Object.assign(ret, {
      submissions: parseBignum(nums[0].textContent),
      accepted: parseBignum(nums[1].textContent),
      rank: parseBignum(nums[2].textContent),
      difficulty: difficulties
    });
  }
  return ret;
}
let tos = o => o.toString();
let ge = (a, b) => a >= b || Number.isNaN(b);
let le = (a, b) => a <= b || Number.isNaN(b);
function getTd(d1, d2, fmt, cmp) {
  if (fmt == null) {
    fmt = tos;
  }
  if (cmp == null) {
    cmp = ge;
  }
  if (cmp(d1, d2)) {
    return `<td><span class="am-badge am-badge-success">${fmt(d1)}</span></td><td>${fmt(d2)}</td>`
  }
  return `<td>${fmt(d1)}</td><td><span class="am-badge am-badge-success">${fmt(d2)}</span></td>`
}
function compareUsers(me, user) {
  function getDiffTd() {
    let ret = "";
    diffName.forEach((v, k) => {
      ret += `<tr><td><span class="am-badge lg-bg-${diffColor[k]}">${v}</span></td>${getTd(me.difficulty[k], user.difficulty[k])}</tr>`;
    });
    return ret;
  }
  let curTime = new Date().getTime();
  let myDay = Math.ceil((curTime - me.regTime.getTime()) / 86400000);
  let userDay = Math.ceil((curTime - user.regTime.getTime()) / 86400000);
  if (modalCmp) {
    document.body.removeChild(modalCmp);
  }
  modalCmp = document.createElement("div");
  modalCmp.className = "am-modal";
  document.body.appendChild(modalCmp);
  modalCmp.innerHTML = `
<div class="am-modal-dialog">
  <table class="am-table">
    <thead>
      <tr>
        <th style="width:140px"><a href="javascript:;" class="am-close am-close-spin" data-am-modal-close>&times;</a></th>
        <th style="width:200px;text-align:center">${me.username}</th>
        <th style="width:200px;text-align:center">${user.username}</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>UID</td>${getTd(me.uid, user.uid, tos, le)}</tr>
      <tr><td>权限</td>${getTd(me.permission, user.permission, o => permName[o])}</tr>
      <tr><td>注册天数</td>${getTd(myDay, userDay)}</tr>
      <tr><td>提交数</td>${getTd(me.submissions, user.submissions, o => toBignum(o))}</tr>
      <tr><td>通过数</td>${getTd(me.accepted, user.accepted, o => toBignum(o))}</tr>
      <tr><td>排名</td>${getTd(me.rank, user.rank, o => toBignum(o), le)}</tr>
      ${getDiffTd()}
    </tbody>
  </table>
</div>`;
  $(modalCmp).modal("open");
}
let btn = document.createElement("button");
btn.textContent = "比较";
btn.className = "am-btn am-btn-sm am-btn-danger";
btn.onclick =　() => {
  $(modalLoad).modal("open");
  let xhr = new XMLHttpRequest();
  let myuid = document.querySelector(".avatar").src;
  myuid = parseInt(myuid.substring(38, myuid.length - 4));
  xhr.open("GET", `https://www.luogu.org/space/show?uid=${myuid}`);
  xhr.onload = () => {
    $(modalLoad).modal("close");
    compareUsers(
      parseUser(new DOMParser().parseFromString(xhr.responseText, "text/html")),
      parseUser(document));
  };
  xhr.send();
};
document.querySelector(".lg-summary-content p").appendChild(btn);

let modalCmp;
let modalLoad = document.createElement("div");
modalLoad.className = "am-modal am-modal-loading";
modalLoad.innerHTML = `<div class="am-modal-dialog"><div class="am-modal-hd">正在请求我的数据</div><div class="am-modal-bd"><span class="am-icon-spinner am-icon-spin"></span></div></div>`;
document.body.appendChild(modalLoad);