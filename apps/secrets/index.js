"use strict";
(() => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const salt = encoder.encode("su226做出了hexo-generator-secret，但都是抄的hexo-blog-encrypt，请问这有意义吗？");
  
  function fromBase64(data) {
    return new Uint8Array(Array.from(atob(data)).map(x => x.charCodeAt(0)));
  }
  
  function toHex(data) {
    return data.reduce((result, byte) => result + byte.toString(16).padStart(2, '0'), "");
  }
  
  async function getSecret(password) {
    const pbkdf2 = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      {name: 'PBKDF2'},
      false,
      ["deriveKey", "deriveBits"]
    );
    const filename = await crypto.subtle.deriveBits(
      {name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: 200000},
      pbkdf2,
      32 * 8
    );
    const hex = toHex(new Uint8Array(filename));
    const request = await fetch(`/secrets/${hex}`);
    if (!request.ok) {
      return [null, false];
    }
    const {hmac, iv, encrypted} = await request.json();
    const decryptKey = await crypto.subtle.deriveKey(
      {name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: 100000},
      pbkdf2,
      {name: 'AES-CBC', length: 256},
      false,
      ['decrypt']
    );
    const hmacKey = await crypto.subtle.deriveKey(
      {name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: 100000},
      pbkdf2,
      {name: 'HMAC', hash: 'SHA-256', length: 256},
      false,
      ["verify"]
    );
    const decrypted = await crypto.subtle.decrypt(
      {name: 'AES-CBC', iv: fromBase64(iv)},
      decryptKey,
      fromBase64(encrypted)
    );
    const content = decoder.decode(decrypted);
    const verify = await crypto.subtle.verify(
      {name: 'HMAC', hash: 'SHA-256'},
      hmacKey,
      fromBase64(hmac),
      decrypted
    );
    return [content, verify];
  }
  
  function showAlert(message) {
    document.querySelector(".post-subtitle").textContent = message;
  }
  
  async function showSecret(password, push) {
    window.dispatchEvent(new Event("deinit"));
    if (push) {
      history.pushState(null, "", `?${password}`);
    }
    showAlert("正在获取密文");
    const result = document.querySelector("#result");
    result.innerHTML = "";
    let content, verify;
    try {
      [content, verify] = await getSecret(password);
    } catch (e) {
      console.error(e);
      showAlert("解密过程中出现错误，这不应该发生");
      return;
    }
    if (content === null) {
      showAlert("似乎没有这个密文");
      return;
    }
    result.innerHTML = content;
    for (const script of result.querySelectorAll("script")) {
      const newScript = document.createElement("script");
      newScript.textContent = script.textContent;
      for (const attr of script.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }
      script.replaceWith(newScript);
    }
    if (!verify) {
      showAlert("解密成功，但内容校验失败，你看到的内容可能被篡改，这不应该发生");
    } else {
      showAlert("解密成功");
    }
  }
  
  window.pageModules.push({
    script: document.currentScript.getAttribute("src"),
    init() {
      const input = document.querySelector("#password");
      input.addEventListener("keydown", e => {
        if (e.keyCode === 13) {
          showSecret(input.value, true);
        }
      });
      if (location.search) {
        const password = decodeURIComponent(location.search.slice(1));
        input.value = password;
        showSecret(password, false);
      }
    },
    deinit() {
      window.dispatchEvent(new Event("deinit"));
    }
  });
})();
