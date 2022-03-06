function myalert(message) {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.innerHTML = `\
<div class="dialog">
  <div class="dialog-text">${message}</pre>
  <div class="group dialog-buttons">
    <button class="button" data-action="ok">确定</button>
  </div>
</div>`;
  document.body.appendChild(backdrop);
  return new Promise(resolve => {
    backdrop.querySelector("[data-action=ok]").addEventListener("click", () => {
      backdrop.remove();
      resolve();
    });
  });
}
function myconfirm(message) {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.innerHTML = `\
<div class="dialog">
  <div class="dialog-text">${message}</div>
  <div class="group dialog-buttons">
    <button class="button" data-action="cancel">取消</button>
    <button class="button" data-action="ok">确定</button>
  </div>
</div>`;
  document.body.appendChild(backdrop);
  return new Promise(resolve => {
    backdrop.querySelector("[data-action=cancel]").addEventListener("click", () => {
      backdrop.remove();
      resolve(false);
    });
    backdrop.querySelector("[data-action=ok]").addEventListener("click", () => {
      backdrop.remove();
      resolve(true);
    });
  });
}
function myprompt(message, initial = "") {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.innerHTML = `\
<div class="dialog">
  <input class="entry" type="text" value="${initial}">
  <div class="dialog-text">${message}</div>
  <div class="group dialog-buttons">
    <button class="button" data-action="cancel">取消</button>
    <button class="button" data-action="ok">确定</button>
  </div>
</div>`;
  const entry = backdrop.querySelector("input");
  document.body.appendChild(backdrop);
  return new Promise(resolve => {
    backdrop.querySelector("[data-action=cancel]").addEventListener("click", () => {
      backdrop.remove();
      resolve(null);
    });
    backdrop.querySelector("[data-action=ok]").addEventListener("click", () => {
      backdrop.remove();
      resolve(entry.value);
    });
  });
}
async function promptIfDuplicate(name) {
  while (name !== null) {
    if (name === "") {
      name = await myprompt("文件名为空", name);
      continue;
    }
    if ("sge-" + name in localStorage) {
      name = await myprompt("文件名已被使用，请换一个", name);
      continue;
    }
    break;
  }
  return name;
}
const file = {
  _name: null,
  _element: document.querySelector("#filename"),
  _dirty: false,
  get name() {
    return this._name
  },
  set name(v) {
    this._name = v;
    this._element.textContent = v === null ? "无标题" : v;
  },
  get empty() {
    return this._name === null;
  },
  get dirty() {
    return this._dirty;
  },
  set dirty(v) {
    this._dirty = v;
    this._element.classList.toggle("dirty", v);
  },
  create(content = "") {
    this.name = null;
    editor.setValue(content);
    this.dirty = content != "";
  },
  open(name) {
    this.name = name;
    editor.setValue(localStorage.getItem("sge-" + name));
    this.dirty = false;
  },
  remove() {
    this.name = null;
    this.dirty = true;
  },
  save() {
    localStorage.setItem("sge-" + this._name, editor.getValue());
    this.dirty = false;
  }
};
window.onbeforeunload = () => {
  if (file.dirty) {
    return "有未保存的更改，确定要离开吗？";
  }
};
const editor = CodeMirror(document.querySelector("#editor"), {
  lineNumbers: true,
});
editor.on("change", () => {
  if (backup.checked && !file.empty) {
    file.save();
  } else {
    file.dirty = true;
  }
  if (realtime.checked) {
    show(...parse(editor.getValue()));
  }
});
let chart = echarts.init(document.querySelector("#preview"), null, {renderer: "svg"});
chart.on("click", params => {
  console.log(params);
});
window.addEventListener("resize", () => chart.resize());
function parse(value) {
  let nodes = Immutable.Set();
  let edges = Immutable.Set();
  for (let line of value.split("\n")) {
    line = line.split("#")[0].trim();
    if (line.length == 0) {
      continue;
    }
    let [from, to, label] = line.split(",");
    if (!from) {
      continue;
    }
    from = from.trim();
    nodes = nodes.add(from);
    if (to) {
      to = to.trim();
      nodes = nodes.add(to);
      if (label) {
        edges = edges.add(Immutable.List([from, to, label.trim()]));
      } else {
        edges = edges.add(Immutable.List([from, to, ""]));
      }
    }
  }
  return [nodes, edges];
}
const NODE_THRESOLD = 1024;
const EDGE_THRESOLD = 1024;
async function show(nodes, edges) {
  const nodeCount = nodes.count();
  const edgeCount = edges.count();
  const tooManyNodes = nodeCount > NODE_THRESOLD;
  const tooManyEdges = edgeCount > EDGE_THRESOLD;
  if (warnings.checked && (tooManyNodes || tooManyEdges)) {
    const messages = [];
    if (tooManyNodes) {
      messages.push(`节点过多（${nodeCount} > ${NODE_THRESOLD}）`);
    }
    if (tooManyEdges) {
      messages.push(`边过多（${edgeCount} > ${NODE_THRESOLD}）`);
    }
    messages.push("是否继续？");
    if (await myconfirm(messages.join("\n"))) {
      warnings.checked = false;
    } else {
      realtime.checked = false;
      return false;
    }
  }
  chart.setOption({
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        label: {
          show: true,
        },
        edgeLabel: {
          show: true,
          formatter: "{c}",
        },
        data: nodes.map(x => ({ name: x })).toJS(),
        links: edges.map(([from, to, label]) => ({ source: from, target: to, value: label })).toJS(),
      }
    ]
  });
  return true;
}
function trimEnd(str, sub) {
  if (str.slice(-sub.length) == sub) {
    return str.slice(0, -sub.length);
  }
  return str;
}
function download(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
document.querySelector("#open").addEventListener("click", () => {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.innerHTML = `\
<div class="dialog">
  <ul class="list"></ul>
  <div class="group dialog-buttons">
    <button class="button" data-action="cancel">取消</button>
    <button class="button" data-action="new">新建</button>
    <button class="button" data-action="example">示例</button>
    <label class="button"><input type="file" data-action="upload">上传</label>
  </div>
</div>`;
  const list = backdrop.querySelector(".list");
  for (let key of Object.keys(localStorage).filter(x => x.startsWith("sge-"))) {
    let name = key.slice(4);
    const item = document.createElement("li");
    item.className = "list-group";
    list.appendChild(item);
    const open = document.createElement("button");
    open.textContent = name;
    open.className = "list-button";
    open.addEventListener("click", () => {
      backdrop.remove();
      file.open(name);
    });
    item.appendChild(open);
    const rename = document.createElement("button");
    rename.textContent = "重命名";
    rename.className = "list-button";
    rename.addEventListener("click", async () => {
      const newName = await promptIfDuplicate(await myprompt("请输入新的文件名", name));
      if (newName === null || newName === name) {
        return;
      }
      if (file.name == name) {
        file.name = newName;
      }
      localStorage.setItem("sge-" + newName, localStorage.getItem(key));
      localStorage.removeItem(key);
      open.textContent = newName;
      name = newName;
      key = "sge-" + newName;
    })
    item.appendChild(rename);
    const del = document.createElement("button");
    del.textContent = "删除";
    del.className = "list-button";
    del.addEventListener("click", () => {
      if (file.name == name) {
        file.remove();
      }
      localStorage.removeItem(key);
      item.remove();
    })
    item.appendChild(del);
  }
  document.body.appendChild(backdrop);
  backdrop.querySelector("[data-action=cancel]").addEventListener("click", () => {
    backdrop.remove();
  });
  backdrop.querySelector("[data-action=new]").addEventListener("click", () => {
    file.create();
    backdrop.remove();
  });
  backdrop.querySelector("[data-action=example]").addEventListener("click", () => {
    file.create("# 示例被我🕊️了uwu");
    backdrop.remove();
  });
  backdrop.querySelector("[data-action=upload]").addEventListener("change", async function () {
    const f = this.files[0];
    const name = await promptIfDuplicate(trimEnd(f.name, ".graph.txt"));
    if (name === null) {
      return;
    }
    const text = await f.text();
    file.name = name;
    editor.setValue(text);
    backdrop.remove();
  });
});
document.querySelector("#save").addEventListener("click", async () => {
  if (file.empty) {
    const name = await promptIfDuplicate(await myprompt("请输入文件名"));
    if (name === null) {
      return;
    }
    file.name = name;
  }
  file.save();
});
document.querySelector("#download").addEventListener("click", async () => {
  if (file.empty) {
    const name = await promptIfDuplicate(await myprompt("在下载之前需要先保存"));
    if (name === null) {
      return;
    }
    file.name = name;
    file.save();
  }
  const blob = new Blob([editor.getValue()]);
  const url = URL.createObjectURL(blob);
  download(url, `${file.name}.graph.txt`);
  URL.revokeObjectURL(url);
});
document.querySelector("#shot").addEventListener("click", async () => {
  if (file.empty) {
    const name = await promptIfDuplicate(await myprompt("在截图之前需要先保存"));
    if (name === null) {
      return;
    }
    file.name = name;
    file.save();
  }
  const type = svg.checked ? "svg" : "png";
  download(chart.getDataURL({type: type}), `${file.name}.graph.${type}`);
});
document.querySelector("#refresh").addEventListener("click", () => {
  chart.dispatchAction({type: "restore"});
  show(...parse(editor.getValue()));
});
const warnings = document.querySelector("#warnings");
const realtime = document.querySelector("#realtime");
realtime.addEventListener("change", () => {
  if (realtime.checked) {
    show(...parse(editor.getValue()));
  }
});
const svg = document.querySelector("#svg");
svg.addEventListener("change", () => {
  chart.dispose();
  chart = echarts.init(document.querySelector("#preview"), null, {
    renderer: svg.checked ? "svg" : "canvas"
  });
  show(...parse(editor.getValue()));
});
const backup = document.querySelector("#backup");
backup.addEventListener("change", () => {
  if (backup.checked) {
    if (file.empty) {
      myalert("警告：在保存文件之前自动备份不会生效");
    } else {
      file.save();
    }
  }
});
