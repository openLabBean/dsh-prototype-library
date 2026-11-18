/**
 * 原型库 — Client half.
 *
 * 在 main 面板里提供原型列表、导入、分支、提交、启停与 iframe 预览；
 * 并向 DSH 输入框注册 `@` 源，让原型像知识库一样可以被引用。
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-prototype-library',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'prototypeLibrary'
    const PANEL_ID = 'prototype-library'
    const API = '/prototype-library/api'
    const EVENT_OPEN = 'prototype-library:open'

    // ── locale ──────────────────────────────────────────────────────────────

    const ZH = {
      panel: '原型库',
      title: '原型库',
      subtitle: '纳管本地原型 · 分支、提交与预览',
      import: '导入原型',
      refresh: '刷新',
      search: '搜索名称、项目或目录',
      allProjects: '全部项目',
      count: '共 {n} 个原型',
      filtered: '筛选出 {n} 个',
      emptyTitle: '还没有纳管原型',
      emptyDesc: '导入本地已完成的前端原型目录，之后可以在列表页切分支、启停和预览。',
      emptyAction: '导入第一个原型',
      errorTitle: '加载失败',
      retry: '重试',
      noMatch: '没有匹配的原型',
      noMatchDesc: '换个关键词或清除筛选条件。',
      clearFilters: '清除筛选',
      statusRunning: '运行中',
      statusStarting: '启动中',
      statusStopped: '未启动',
      statusError: '异常',
      branch: '分支',
      newBranch: '新建分支',
      start: '启动',
      stop: '停止',
      restart: '重启',
      preview: '预览',
      details: '详情',
      openDir: '打开目录',
      remove: '移除纳管',
      project: '项目',
      ungrouped: '未分组',
      updated: '更新于',
      noBranch: '无分支',
      dirty: '有未提交改动',
      clean: '工作区干净',
      ahead: '领先 {n}',
      behind: '落后 {n}',
      commit: '提交',
      commitTitle: '提交改动',
      commitDesc: '把当前工作区的全部改动提交到当前分支。',
      commitScope: '提交范围：当前工作区的全部改动',
      message: '提交信息',
      messagePlaceholder: '例如：优化邮件推送设置页的筛选交互',
      onlyCommit: '仅提交',
      commitAndPush: '提交并推送',
      submit: '提交',
      cancel: '取消',
      done: '完成',
      close: '关闭',
      importTitle: '导入本地原型',
      importDesc: '只纳管本机已有目录，不会从远程 clone。',
      dir: '原型目录',
      dirPlaceholder: '点击「浏览…」选择原型目录',
      browse: '浏览…',
      inspect: '检查目录',
      inspecting: '检查中…',
      name: '名称',
      projectLabel: '归属项目',
      projectPlaceholder: '例如：WhaleBI',
      repoUrl: 'Git 仓库地址',
      repoUrlPlaceholder: 'git@gitlab.company.com:team/proto.git',
      repoOptional: '非必填。填写后可在原型库里切换分支、提交与推送，做版本管理。',
      command: '启动命令（可选）',
      commandPlaceholder: '留空则自动识别 Vite / npm run dev / 静态页面',
      thumbnail: '缩略图',
      thumbAuto: '启动后自动截图',
      thumbAutoDesc: '导入后启动预览，再在详情里点「自动截图」。',
      thumbPick: '从目录内图片选择',
      inspectHint: '选中目录后会自动识别名称、启动方式与可用截图。',
      needDir: '请先选择原型目录',
      creating: '导入中…',
      create: '导入',
      importSuccess: '已导入原型',
      gitTitle: 'Git',
      tabGit: 'Git',
      tabPreview: '预览',
      tabBasic: '基础信息',
      searchBranch: '搜索分支',
      noMatchingBranch: '没有匹配的分支',
      gitRepo: '远程仓库',
      noRepo: '该目录还不是 Git 仓库',
      noRemote: '未绑定 origin',
      initRepo: '初始化仓库',
      initHint: '初始化后不会自动提交，可再点「提交」创建首个 commit。',
      fetch: '拉取远程',
      fetching: '拉取中…',
      branches: '分支',
      local: '本地',
      remote: '远程',
      switchBranch: '切换',
      switchSuccess: '已切换到 {name}',
      switchRepaired: '已自动停止跟踪 node_modules 并提交，再切换到 {name}',
      noChanges: '工作区没有未提交改动',
      changedFiles: '{n} 个文件有改动',
      runtime: '预览',
      port: '端口',
      address: '地址',
      logs: '运行日志',
      noLogs: '暂无日志',
      capture: '自动截图',
      capturing: '截图中…',
      upload: '上传图片',
      removeThumb: '移除缩略图',
      danger: '危险操作',
      removeTitle: '移除纳管',
      removeDesc: '只从原型库移除记录，不会删除磁盘上的文件。',
      confirmRemove: '确认移除',
      pin: '置顶',
      unpin: '取消置顶',
      pinnedLabel: '已置顶',
      pinToast: '已置顶 {name}',
      unpinToast: '已取消置顶 {name}',
      newBranchTitle: '新建分支',
      newBranchDesc: '选择基点分支后创建并切换，未提交的改动会一起带过去。',
      baseBranch: '基于分支',
      baseBranchCurrent: '{name}（当前分支）',
      baseBranchHint: '新分支从所选分支的最新提交开始；选远程分支会自动建立跟踪。',
      branchName: '分支名',
      branchPlaceholder: 'feature/new-ui',
      createBranch: '创建并切换',
      switching: '切换中…',
      previewTitle: '预览',
      deviceDesktop: '桌面',
      deviceMobile: '手机',
      openExternal: '新窗口打开',
      previewNotRunning: '预览还没有启动。',
      startPreview: '启动并预览',
      saved: '已保存',
      started: '已启动',
      stopped: '已停止',
      committed: '已提交',
      pushed: '已推送',
      pushFailed: '提交成功，但推送失败',
      pushRetry: '可在详情里点「提交并推送」重试。',
      gitInfo: 'Git 状态',
      lastCommit: '最近提交',
      noCommits: '还没有提交',
      thumbTitle: '设置缩略图',
      thumbCurrent: '当前缩略图',
      thumbEmpty: '还没有缩略图',
      pickImage: '选择图片',
      imageHint: '支持 PNG / JPG / WebP，不超过 8MB。',
      noChrome: '未找到 Chrome / Chromium，可改用上传图片。',
      notRunning: '请先启动预览再截图。',
      atSection: '原型',
      atDesc: '纳管的前端原型',
      timeJustNow: '刚刚',
      timeMinutes: '{n} 分钟前',
      timeHours: '{n} 小时前',
      timeDays: '{n} 天前',
      timeUpdated: '更新于 {time}',
      picked: '已选择：{path}',
      pickerUnavailable: '当前环境不支持系统目录选择。',
      browseFailed: '打开目录选择器失败',
      inspectFailed: '检查目录失败',
      loading: '加载中…',
      operationFailed: '操作失败',
      autoThumbHint: '启动预览后可一键截图',
      repoBound: '已绑定远程仓库',
      noGitTitle: '目录还不是 Git 仓库',
      noGitDesc: '初始化后即可提交、切分支和推送。',
      worktreeDirty: '工作区有未提交改动，先提交再切换分支。',
      confirmRemoveHint: '输入框、列表记录会移除；磁盘文件保持不变。',
      logsHint: '最近 200 行',
      dirMissing: '目录不存在，可能已被移动',
      selectImage: '点击选择图片',
      removeThumbConfirm: '确定移除当前缩略图？',
    }

    const EN = {
      panel: 'Prototype Library',
      title: 'Prototype Library',
      subtitle: 'Local prototypes · branches, commits and preview',
      import: 'Import',
      refresh: 'Refresh',
      search: 'Search name, project or directory',
      allProjects: 'All projects',
      count: '{n} prototypes',
      filtered: '{n} shown',
      emptyTitle: 'No prototypes yet',
      emptyDesc: 'Import a finished local front-end prototype to switch branches, run it and preview it from this list.',
      emptyAction: 'Import the first prototype',
      errorTitle: 'Failed to load',
      retry: 'Retry',
      noMatch: 'No matching prototypes',
      noMatchDesc: 'Try another keyword or clear the filters.',
      clearFilters: 'Clear filters',
      statusRunning: 'Running',
      statusStarting: 'Starting',
      statusStopped: 'Stopped',
      statusError: 'Error',
      branch: 'Branch',
      newBranch: 'New branch',
      start: 'Start',
      stop: 'Stop',
      restart: 'Restart',
      preview: 'Preview',
      details: 'Details',
      openDir: 'Open folder',
      remove: 'Remove',
      project: 'Project',
      ungrouped: 'Ungrouped',
      updated: 'Updated',
      noBranch: 'No branch',
      dirty: 'Uncommitted changes',
      clean: 'Clean',
      ahead: '{n} ahead',
      behind: '{n} behind',
      commit: 'Commit',
      commitTitle: 'Commit changes',
      commitDesc: 'Commit every change in the working tree to the current branch.',
      commitScope: 'Scope: all working tree changes',
      message: 'Commit message',
      messagePlaceholder: 'e.g. refine filters on the email delivery page',
      onlyCommit: 'Commit only',
      commitAndPush: 'Commit and push',
      submit: 'Commit',
      cancel: 'Cancel',
      done: 'Done',
      close: 'Close',
      importTitle: 'Import local prototype',
      importDesc: 'Registers an existing local folder; nothing is cloned.',
      dir: 'Prototype folder',
      dirPlaceholder: 'Click Browse to choose a folder',
      browse: 'Browse…',
      inspect: 'Inspect',
      inspecting: 'Inspecting…',
      name: 'Name',
      projectLabel: 'Project',
      projectPlaceholder: 'e.g. WhaleBI',
      repoUrl: 'Git remote',
      repoUrlPlaceholder: 'git@gitlab.company.com:team/proto.git',
      repoOptional: 'Optional. Fill it in to manage versions — switch branches, commit and push — from the library.',
      command: 'Start command (optional)',
      commandPlaceholder: 'Blank: detect Vite / npm run dev / static page',
      thumbnail: 'Thumbnail',
      thumbAuto: 'Capture after start',
      thumbAutoDesc: 'Start the preview, then use Capture in details.',
      thumbPick: 'Pick an image in the folder',
      inspectHint: 'The folder is inspected automatically after you choose it.',
      needDir: 'Choose a prototype folder first',
      creating: 'Importing…',
      create: 'Import',
      importSuccess: 'Prototype imported',
      gitTitle: 'Git',
      tabGit: 'Git',
      tabPreview: 'Preview',
      tabBasic: 'Basics',
      searchBranch: 'Search branches',
      noMatchingBranch: 'No matching branch',
      gitRepo: 'Remote',
      noRepo: 'This folder is not a Git repository',
      noRemote: 'No origin remote',
      initRepo: 'Initialize',
      initHint: 'Initializing does not commit automatically.',
      fetch: 'Fetch',
      fetching: 'Fetching…',
      branches: 'Branches',
      local: 'Local',
      remote: 'Remote',
      switchBranch: 'Switch',
      switchSuccess: 'Switched to {name}',
      switchRepaired: 'Untracked node_modules and committed, then switched to {name}',
      noChanges: 'No uncommitted changes',
      changedFiles: '{n} changed files',
      runtime: 'Preview',
      port: 'Port',
      address: 'URL',
      logs: 'Logs',
      noLogs: 'No logs yet',
      capture: 'Capture',
      capturing: 'Capturing…',
      upload: 'Upload image',
      removeThumb: 'Remove thumbnail',
      danger: 'Danger zone',
      removeTitle: 'Remove prototype',
      removeDesc: 'Removes the registry entry only; files on disk stay untouched.',
      confirmRemove: 'Remove',
      pin: 'Pin',
      unpin: 'Unpin',
      pinnedLabel: 'Pinned',
      pinToast: 'Pinned {name}',
      unpinToast: 'Unpinned {name}',
      newBranchTitle: 'New branch',
      newBranchDesc: 'Pick a base branch, create and switch; uncommitted changes come along.',
      baseBranch: 'Base branch',
      baseBranchCurrent: '{name} (current)',
      baseBranchHint: 'The new branch starts at the tip of the selected branch; remote bases are tracked automatically.',
      branchName: 'Branch name',
      branchPlaceholder: 'feature/new-ui',
      createBranch: 'Create and switch',
      switching: 'Switching…',
      previewTitle: 'Preview',
      deviceDesktop: 'Desktop',
      deviceMobile: 'Phone',
      openExternal: 'Open in new tab',
      previewNotRunning: 'Preview is not running yet.',
      startPreview: 'Start and preview',
      saved: 'Saved',
      started: 'Started',
      stopped: 'Stopped',
      committed: 'Committed',
      pushed: 'Pushed',
      pushFailed: 'Commit succeeded, push failed',
      pushRetry: 'Use Commit and push again from details to retry.',
      gitInfo: 'Git status',
      lastCommit: 'Last commit',
      noCommits: 'No commits yet',
      thumbTitle: 'Thumbnail',
      thumbCurrent: 'Current thumbnail',
      thumbEmpty: 'No thumbnail',
      pickImage: 'Choose image',
      imageHint: 'PNG / JPG / WebP, up to 8MB.',
      noChrome: 'Chrome / Chromium not found; upload an image instead.',
      notRunning: 'Start the preview before capturing.',
      atSection: 'Prototypes',
      atDesc: 'Managed front-end prototypes',
      timeJustNow: 'just now',
      timeMinutes: '{n} minutes ago',
      timeHours: '{n} hours ago',
      timeDays: '{n} days ago',
      timeUpdated: 'Updated {time}',
      picked: 'Selected: {path}',
      pickerUnavailable: 'This environment has no native folder picker.',
      browseFailed: 'Could not open the folder picker',
      inspectFailed: 'Could not inspect the folder',
      loading: 'Loading…',
      operationFailed: 'Operation failed',
      autoThumbHint: 'Start the preview to capture a thumbnail',
      repoBound: 'Remote bound',
      noGitTitle: 'Not a Git repository',
      noGitDesc: 'Initialize it to commit, branch and push.',
      worktreeDirty: 'Commit changes before switching branches.',
      confirmRemoveHint: 'Registry and runtime only; files stay on disk.',
      logsHint: 'Last 200 lines',
      dirMissing: 'Folder is missing; it may have moved',
      selectImage: 'Choose an image',
      removeThumbConfirm: 'Remove the current thumbnail?',
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    function fmt(template, vars) {
      return String(template || '').replace(/\{(\w+)\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(vars || {}, key) ? String(vars[key]) : match,
      )
    }

    async function api(path, options = {}) {
      const init = {
        cache: 'no-store',
        method: options.method || (options.body ? 'POST' : 'GET'),
        headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) },
      }
      if (options.body !== undefined) init.body = JSON.stringify(options.body)
      const response = await fetch(API + path, init)
      const text = await response.text()
      let data = null
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { error: text }
        }
      }
      if (!response.ok) {
        const error = new Error((data && data.error) || `HTTP ${response.status}`)
        error.code = data && data.code
        error.details = data && data.details
        error.status = response.status
        throw error
      }
      return data
    }

    function timeAgo(t, iso) {
      if (!iso) return ''
      const time = new Date(iso).getTime()
      if (!Number.isFinite(time)) return ''
      const diff = Math.max(0, Date.now() - time)
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return t('timeJustNow')
      if (minutes < 60) return fmt(t('timeMinutes'), { n: minutes })
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return fmt(t('timeHours'), { n: hours })
      const days = Math.floor(hours / 24)
      if (days < 30) return fmt(t('timeDays'), { n: days })
      return new Date(time).toLocaleDateString()
    }

    function statusOf(runtime) {
      if (!runtime) return 'stopped'
      if (runtime.status === 'running') return 'running'
      if (runtime.status === 'starting') return 'starting'
      if (runtime.status === 'error') return 'error'
      return 'stopped'
    }

    function statusLabel(t, status) {
      if (status === 'running') return t('statusRunning')
      if (status === 'starting') return t('statusStarting')
      if (status === 'error') return t('statusError')
      return t('statusStopped')
    }

    function kindLabel(kind) {
      if (kind === 'vite') return 'Vite'
      if (kind === 'static') return 'Static HTML'
      if (kind === 'node') return 'Node'
      return 'Unknown'
    }

    function errText(error) {
      if (!error) return ''
      const base = error.message || String(error)
      if (error.code === 'DIRTY_WORKTREE') return base
      return base
    }

    function errorMessage(t, error) {
      if (!error) return ''
      if (error.code === 'DIRTY_WORKTREE') return t('worktreeDirty')
      if (error.code === 'AUTH_REQUIRED' || error.code === 'PUSH_REJECTED') return error.message
      return errText(error) || t('operationFailed')
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolveRead, rejectRead) => {
        const reader = new FileReader()
        reader.onload = () => resolveRead(String(reader.result || ''))
        reader.onerror = () => rejectRead(new Error('读取图片失败'))
        reader.readAsDataURL(file)
      })
    }

    // ── icons ───────────────────────────────────────────────────────────────

    const ICONS = {
      folder:
        '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l1.8 2h8A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 5v6h-6"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
      play: '<path d="M7 5.5v13l11-6.5z"/>',
      stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
      eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
      branch:
        '<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="8" r="2.4"/><path d="M6 8.4v7.2M8.4 6h4.2a3 3 0 0 1 3 3v.6"/>',
      commit:
        '<circle cx="12" cy="12" r="3.2"/><path d="M3 12h5.8M15.2 12H21"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      chevron: '<path d="m6 9 6 6 6-6"/>',
      external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v4.5A1.5 1.5 0 0 1 17.5 20h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H10"/>',
      camera:
        '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.2-2h6.2l1.2 2h1.2A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/>',
      upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
      trash:
        '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/><path d="M10 11v6M14 11v6"/>',
      terminal: '<path d="m5 7 4 5-4 5"/><path d="M12 17h6"/>',
      monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/>',
      phone: '<rect x="8" y="2.5" width="8" height="19" rx="2"/><path d="M11 18.5h2"/>',
      check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
      alert: '<path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4M12 17h.01"/>',
      save: '<path d="M5 4h11l3 3v13H5z"/><path d="M9 4v5h6V4"/><path d="M8 14h8v6H8z"/>',
      code: '<path d="m9 8-4 4 4 4"/><path d="m15 8 4 4-4 4"/>',
      dot: '<circle cx="12" cy="12" r="4"/>',
      lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      arrowLeft: '<path d="M20 12H4"/><path d="m10 6-6 6 6 6"/>',
      sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
      pin: '<path d="M12 3v5"/><path d="M8.2 8h7.6l-1 5.2H9.2z"/><path d="M12 13.2V21"/>',
      pinOff: '<path d="M12 3v5"/><path d="M8.2 8h7.6l-1 5.2H9.2z"/><path d="M12 13.2V21"/><path d="m4 4 16 16"/>',
    }

    function Icon(props) {
      const size = props.size || 16
      const stroke = props.strokeWidth || 1.8
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: stroke,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        style: props.style,
        dangerouslySetInnerHTML: { __html: ICONS[props.name] || '' },
      })
    }

    function PanelIcon() {
      return h(
        'svg',
        {
          width: 18,
          height: 18,
          viewBox: '0 0 64 64',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('path', { d: 'M31 15H17a4 4 0 0 0-4 4v26a4 4 0 0 0 4 4h26a4 4 0 0 0 4-4V33' }),
        h('path', { d: 'M13 25h16M25 25v24' }),
        h('path', { d: 'm34 35 2-9L48 14a4.24 4.24 0 0 1 6 6L42 32l-8 3Z' }),
        h('path', { d: 'm45 17 6 6' }),
      )
    }

    // ── primitives ──────────────────────────────────────────────────────────

    function Spinner(props) {
      return h('span', { className: 'pl-spinner', style: props.size ? { width: props.size, height: props.size } : undefined })
    }

    function Button(props) {
      const variant = props.variant || 'secondary'
      return h(
        'button',
        {
          type: props.type || 'button',
          className: `pl-btn ${variant === 'primary' ? 'pl-btn-primary' : ''} ${variant === 'ghost' ? 'pl-btn-ghost' : ''} ${variant === 'danger' ? 'pl-btn-danger' : ''} ${props.size === 'sm' ? 'pl-btn-sm' : ''} ${props.className || ''}`,
          onClick: props.onClick,
          disabled: props.disabled || props.busy,
          title: props.title,
        },
        props.busy ? h(Spinner, { size: 13 }) : props.icon ? h(Icon, { name: props.icon, size: props.iconSize || 14 }) : null,
        props.children ? h('span', null, props.children) : null,
      )
    }

    function StatusBadge(props) {
      const status = props.status
      return h(
        'span',
        { className: `pl-status pl-status-${status}` },
        h('span', { className: 'pl-status-dot' }),
        h('span', null, statusLabel(props.t, status)),
      )
    }

    function Modal(props) {
      React.useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key === 'Escape') props.onClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
      }, [props.onClose])
      return h(
        'div',
        {
          className: 'pl-overlay',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) props.onClose()
          },
        },
        h(
          'div',
          {
            className: `pl-modal ${props.wide ? 'pl-modal-wide' : ''} ${props.large ? 'pl-modal-large' : ''} ${props.className || ''}`,
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': props.title,
          },
          h(
            'div',
            { className: 'pl-modal-head' },
            h(
              'div',
              { className: 'pl-modal-heading' },
              h('h2', null, props.title),
              props.subtitle ? h('p', null, props.subtitle) : null,
            ),
            h('button', { type: 'button', className: 'pl-icon-btn', onClick: props.onClose, title: props.t('close'), 'aria-label': props.t('close') }, h(Icon, { name: 'close', size: 16 })),
          ),
          h('div', { className: 'pl-modal-body' + (props.bodyFixed ? ' pl-modal-body-fixed' : '') }, props.children),
          props.footer ? h('div', { className: 'pl-modal-foot' }, props.footer) : null,
        ),
      )
    }

    function Field(props) {
      return h(
        'label',
        { className: 'pl-field' },
        h('span', { className: 'pl-field-label' }, props.label, props.optional ? h('em', null, ` ${props.optional}`) : null),
        props.children,
        props.hint ? h('span', { className: 'pl-field-hint' }, props.hint) : null,
      )
    }

    function Toast(props) {
      const toast = props.toast
      if (!toast) return null
      return h(
        'div',
        { className: `pl-toast pl-toast-${toast.kind || 'info'}`, role: 'status' },
        h(Icon, { name: toast.kind === 'error' ? 'alert' : 'check', size: 15 }),
        h('span', null, toast.message),
      )
    }

    function EmptyState(props) {
      return h(
        'div',
        { className: 'pl-empty' },
        h('div', { className: 'pl-empty-icon' }, h(Icon, { name: 'folder', size: 26 })),
        h('h3', null, props.title),
        h('p', null, props.desc),
        props.action ? h(Button, { variant: 'primary', icon: 'plus', onClick: props.action.onClick }, props.action.label) : null,
      )
    }

    function Thumb(props) {
      const prototype = props.prototype
      const [broken, setBroken] = React.useState(false)
      const url = prototype.thumbnailUrl
      if (url && !broken) {
        return h('img', {
          className: 'pl-thumb-img',
          src: url,
          alt: prototype.name,
          loading: 'lazy',
          onError: () => setBroken(true),
        })
      }
      const letter = (prototype.name || '?').trim().slice(0, 1).toUpperCase()
      return h(
        'div',
        { className: 'pl-thumb-fallback' },
        h('span', { className: 'pl-thumb-letter' }, letter),
        h('span', { className: 'pl-thumb-kind' }, kindLabel(prototype.kind)),
      )
    }

    // ── styles ──────────────────────────────────────────────────────────────

    const CSS = `
.pl-root, .pl-root *, .pl-root *::before, .pl-root *::after { box-sizing: border-box; }
.pl-root {
  --pl-accent: #447EFD;
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 1.5;
}
.pl-inner { padding: 20px 24px 48px; }
.pl-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 20px; }
.pl-heading { display: flex; gap: 0; align-items: flex-start; min-width: 0; }
.pl-title { margin: 0; font-size: 17px; line-height: 1.3; font-weight: 600; letter-spacing: 0; }
.pl-sub { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12.5px; }
.pl-head-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.pl-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 0 0 16px; }
.pl-search { position: relative; flex: 1 1 260px; max-width: 380px; min-width: 180px; display: flex; align-items: center; }
.pl-search .pl-search-icon { position: absolute; left: 10px; color: var(--dsw-alias-label-tertiary); pointer-events: none; display: flex; }
.pl-search input { width: 100%; height: 32px; padding: 0 10px 0 31px; }
.pl-search-clear { position: absolute; right: 5px; }
.pl-count { margin-left: auto; color: var(--dsw-alias-label-tertiary); font-size: 12px; white-space: nowrap; }
.pl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(252px, 1fr)); gap: 16px; }
.pl-card { min-width: 0; display: flex; flex-direction: column; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; overflow: hidden; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
.pl-card:hover { border-color: var(--dsw-alias-border-l3); box-shadow: 0 8px 28px rgba(0,0,0,.10); }
.pl-thumb { position: relative; aspect-ratio: 16 / 10; background: var(--dsw-alias-bg-base); border-bottom: 1px solid var(--dsw-alias-border-l2); overflow: hidden; cursor: pointer; }
.pl-thumb-img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; background: var(--dsw-alias-bg-base); }
.pl-thumb-fallback { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: linear-gradient(140deg, var(--dsw-alias-bg-layer-1), var(--dsw-alias-bg-base)); color: var(--dsw-alias-label-tertiary); }
.pl-thumb-letter { font-size: 30px; font-weight: 600; color: var(--dsw-alias-label-secondary); opacity: .75; }
.pl-thumb-kind { font-size: 11px; letter-spacing: .02em; }
.pl-thumb-hover { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: flex-end; gap: 6px; padding: 8px; background: linear-gradient(to top, rgba(0,0,0,.42), transparent 45%); opacity: 0; transition: opacity .15s ease; }
.pl-thumb:hover .pl-thumb-hover { opacity: 1; }
.pl-thumb-hover .pl-icon-btn { background: rgba(255,255,255,.92); color: #1a1a1a; border-color: transparent; }
.pl-pin-btn { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid transparent; background: rgba(255,255,255,.92); color: #1a1a1a; font-family: inherit; font-size: 11.5px; font-weight: 500; cursor: pointer; transition: background .15s ease, filter .15s ease; }
.pl-pin-btn:hover:not(:disabled) { background: #fff; }
.pl-pin-btn.is-pinned { background: var(--pl-accent); color: #fff; }
.pl-pin-btn.is-pinned:hover:not(:disabled) { filter: brightness(1.08); }
.pl-pin-btn:disabled { opacity: .6; cursor: default; }
.pl-pin-badge { position: absolute; right: 8px; top: 8px; display: inline-flex; align-items: center; justify-content: center; width: 21px; height: 21px; border-radius: 999px; background: var(--pl-accent); color: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.18); }
.pl-card.is-pinned { border-color: var(--pl-accent); }
.pl-card.is-pinned:hover { border-color: var(--pl-accent); box-shadow: 0 8px 28px rgba(68,126,253,.22); }
.pl-status { position: absolute; left: 8px; top: 8px; display: inline-flex; align-items: center; gap: 5px; height: 21px; padding: 0 8px; border-radius: 999px; font-size: 11px; line-height: 1; background: rgba(20,20,20,.66); color: #fff; backdrop-filter: blur(6px); }
.pl-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-label-tertiary); }
.pl-status-running .pl-status-dot { background: var(--dsw-alias-state-success-primary); }
.pl-status-starting .pl-status-dot { background: var(--dsw-alias-state-warning-primary); animation: pl-pulse 1.1s ease-in-out infinite; }
.pl-status-error .pl-status-dot { background: var(--dsw-alias-state-error-primary); }
.pl-card-body { padding: 11px 12px 12px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.pl-card-head { display: flex; align-items: flex-start; gap: 8px; min-width: 0; }
.pl-name { margin: 0; font-size: 13.5px; font-weight: 550; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.pl-card-meta { display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }
.pl-tag { display: inline-flex; align-items: center; max-width: 130px; height: 19px; padding: 0 7px; border-radius: 5px; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-meta-dot { width: 2px; height: 2px; border-radius: 50%; background: currentColor; flex: none; }
.pl-branch-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.pl-branch-row .pl-select { flex: 1; min-width: 0; height: 28px; font-size: 12px; padding: 0 22px 0 8px; }
.pl-card-actions { display: flex; align-items: center; gap: 6px; padding-top: 2px; }
.pl-card-actions .pl-btn { height: 28px; padding: 0 8px; font-size: 12px; }
.pl-grow { flex: 1; }
.pl-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 11px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: transparent; color: var(--dsw-alias-label-primary); font-size: 12.5px; font-family: inherit; cursor: pointer; white-space: nowrap; transition: background .12s ease, border-color .12s ease, color .12s ease; }
.pl-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.pl-btn:disabled { opacity: .5; cursor: not-allowed; }
.pl-btn-primary { background: var(--pl-accent); border-color: transparent; color: #fff; }
.pl-btn-primary:hover:not(:disabled) { background: var(--pl-accent); filter: brightness(1.06); }
.pl-btn-danger { color: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-border-l2); }
.pl-btn-danger:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-1); border-color: var(--dsw-alias-state-error-primary); }
.pl-btn-ghost { border-color: transparent; }
.pl-btn-sm { height: 26px; padding: 0 8px; font-size: 11.5px; }
.pl-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; flex: none; font-family: inherit; }
.pl-icon-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.pl-icon-btn:disabled { opacity: .45; cursor: not-allowed; }
.pl-input, .pl-select, .pl-textarea { width: 100%; min-width: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-family: inherit; font-size: 12.5px; }
.pl-input, .pl-select { height: 34px; padding: 0 10px; }
.pl-select { padding-right: 24px; appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--dsw-alias-label-tertiary) 50%), linear-gradient(135deg, var(--dsw-alias-label-tertiary) 50%, transparent 50%); background-position: calc(100% - 13px) 13px, calc(100% - 9px) 13px; background-size: 4px 4px, 4px 4px; background-repeat: no-repeat; }
.pl-textarea { padding: 8px 10px; min-height: 74px; resize: vertical; line-height: 1.5; }
.pl-input:focus, .pl-select:focus, .pl-textarea:focus { outline: none; border-color: var(--pl-accent); box-shadow: 0 0 0 2px var(--dsw-alias-bg-layer-1); }
.pl-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.pl-field-label { color: var(--dsw-alias-label-secondary); font-size: 12.5px; font-weight: 500; }
.pl-field-label em { font-style: normal; color: var(--dsw-alias-label-tertiary); font-weight: 400; }
.pl-field-hint { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 1.45; }
.pl-form { display: flex; flex-direction: column; gap: 16px; }
.pl-form-row { display: flex; gap: 10px; }
.pl-form-row > * { flex: 1; min-width: 0; }
.pl-modal { width: min(560px, 100%); max-height: calc(100vh - 64px); display: flex; flex-direction: column; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 14px; box-shadow: 0 24px 72px rgba(0,0,0,.28); overflow: hidden; }
.pl-modal-wide { width: min(1040px, 100%); }
.pl-modal-large { width: min(800px, 100%); }
.pl-overlay { position: fixed; inset: 0; z-index: 2400; display: flex; align-items: center; justify-content: center; padding: 22px; background: rgba(0,0,0,.38); --pl-accent: #447EFD; }
.pl-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 18px 22px 14px; border-bottom: 1px solid var(--dsw-alias-border-l2); flex: none; }
.pl-modal-heading h2 { margin: 0; font-size: 16px; font-weight: 600; }
.pl-modal-heading p { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }
.pl-modal-body { padding: 20px 22px; overflow: auto; min-height: 0; }
.pl-modal-body-fixed { height: min(68vh, 560px); overflow: hidden; display: flex; flex-direction: column; }
.pl-tabs-body { display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 0; }
.pl-tabs-body > .pl-section { flex: 1 1 auto; min-height: 0; overflow: auto; padding-right: 4px; }
.pl-tabs { display: flex; align-items: center; gap: 21px; flex: none; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.pl-tab { height: 30px; padding: 0; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; background: transparent; color: var(--dsw-alias-label-tertiary); font-family: inherit; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: color .12s ease, border-color .12s ease; }
.pl-tab:hover { color: var(--dsw-alias-label-primary); }
.pl-tab.is-active { color: var(--dsw-alias-label-primary); border-bottom-color: var(--pl-accent); }
.pl-tabs-body > .pl-section.pl-tab-hidden { display: none; }
.pl-tabs-body > .pl-section:not(.pl-tab-hidden) { border-top: none; }
.pl-tabs-body > .pl-section:not(.pl-tab-hidden) ~ .pl-section:not(.pl-tab-hidden) { border-top: 1px solid var(--dsw-alias-border-l2); }
.pl-modal-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 14px 22px; border-top: 1px solid var(--dsw-alias-border-l2); flex: none; }
.pl-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 66px 24px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 14px; background: var(--dsw-alias-bg-layer-1); }
.pl-empty-icon { width: 48px; height: 48px; border-radius: 13px; display: grid; place-items: center; color: var(--pl-accent); background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l2); margin-bottom: 12px; }
.pl-empty h3 { margin: 0 0 5px; font-size: 14px; font-weight: 600; }
.pl-empty p { margin: 0 0 14px; max-width: 360px; color: var(--dsw-alias-label-tertiary); font-size: 12.5px; }
.pl-error { display: flex; flex-direction: column; gap: 8px; padding: 18px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.pl-error h3 { margin: 0; font-size: 13px; color: var(--dsw-alias-state-error-primary); }
.pl-error p { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px; word-break: break-word; }
.pl-loading { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 60px 0; color: var(--dsw-alias-label-tertiary); }
.pl-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--dsw-alias-border-l3); border-top-color: var(--pl-accent); animation: pl-spin .75s linear infinite; flex: none; }
.pl-section { display: flex; flex-direction: column; gap: 9px; padding: 13px 0; border-top: 1px solid var(--dsw-alias-border-l2); }
.pl-section:first-child { border-top: none; padding-top: 0; }
.pl-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pl-section-title { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.pl-kv { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 5px 10px; font-size: 12px; }
.pl-kv dt { color: var(--dsw-alias-label-tertiary); }
.pl-kv dd { margin: 0; color: var(--dsw-alias-label-secondary); min-width: 0; overflow-wrap: anywhere; }
.pl-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; padding: 1px 4px; border-radius: 4px; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l2); }
.pl-log { margin: 0; padding: 10px 11px; max-height: 190px; overflow: auto; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.pl-branch-list { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow: auto; }
.pl-branch-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 7px; border: 1px solid transparent; font-size: 12px; min-width: 0; }
.pl-branch-item:hover { background: var(--dsw-alias-interactive-bg-hover); }
.pl-branch-name { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-branch-kind { font-size: 10.5px; color: var(--dsw-alias-label-tertiary); border: 1px solid var(--dsw-alias-border-l2); border-radius: 4px; padding: 0 4px; flex: none; }
.pl-branch-search-row { display: flex; align-items: center; gap: 7px; }
.pl-branch-search-row .pl-branch-search { height: 30px; font-size: 12px; }
.pl-branch-picker { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; height: 28px; padding: 0 8px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary); font-family: inherit; font-size: 11.5px; cursor: pointer; text-align: left; }
.pl-branch-picker:hover:not(:disabled) { border-color: var(--dsw-alias-border-l3); color: var(--dsw-alias-label-primary); }
.pl-branch-picker:disabled { opacity: .5; cursor: not-allowed; }
.pl-branch-picker.is-open { border-color: var(--pl-accent); color: var(--dsw-alias-label-primary); }
.pl-branch-picker-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.pl-branch-pop { position: fixed; z-index: 2500; display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); box-shadow: 0 16px 40px rgba(0,0,0,.22); }
.pl-branch-pop .pl-branch-search { height: 30px; font-size: 12px; }
.pl-branch-options { display: flex; flex-direction: column; gap: 2px; max-height: 216px; overflow: auto; }
.pl-branch-option { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 7px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; text-align: left; cursor: pointer; }
.pl-branch-option:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.pl-branch-option.is-current { color: var(--dsw-alias-label-primary); font-weight: 600; }
.pl-branch-option-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-branch-empty { padding: 4px 2px; }
.pl-hint { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }
.pl-warn { display: flex; gap: 7px; align-items: flex-start; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary); font-size: 11.5px; line-height: 1.5; }
.pl-warn-error { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
.pl-warn-ok { color: var(--dsw-alias-state-success-primary); }
.pl-radios { display: flex; flex-wrap: wrap; gap: 8px; }
.pl-radio { display: flex; align-items: flex-start; gap: 7px; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; cursor: pointer; font-size: 12px; min-width: 0; }
.pl-radio.is-active { border-color: var(--pl-accent); }
.pl-radio input { margin: 2px 0 0; accent-color: var(--pl-accent); }
.pl-radio span { display: block; }
.pl-radio small { display: block; color: var(--dsw-alias-label-tertiary); font-size: 11px; margin-top: 1px; }
.pl-image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; }
.pl-image-option { position: relative; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; overflow: hidden; cursor: pointer; aspect-ratio: 16 / 10; background: var(--dsw-alias-bg-base); }
.pl-image-option.is-active { border-color: var(--pl-accent); box-shadow: 0 0 0 1px var(--pl-accent); }
.pl-image-option img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
.pl-image-option span { position: absolute; left: 0; right: 0; bottom: 0; padding: 2px 5px; background: rgba(0,0,0,.55); color: #fff; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-thumb-current { display: flex; align-items: center; gap: 10px; }
.pl-thumb-preview { width: 132px; aspect-ratio: 16 / 10; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); overflow: hidden; background: var(--dsw-alias-bg-base); flex: none; }
.pl-thumb-preview img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
.pl-file-input { display: none; }
.pl-toast { position: fixed; right: 22px; bottom: 22px; z-index: 2600; display: flex; align-items: center; gap: 7px; max-width: 420px; padding: 9px 12px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 10px 30px rgba(0,0,0,.18); font-size: 12.5px; animation: pl-in .16s ease-out; }
.pl-toast-error { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
.pl-toast-success { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.pl-preview-frame-wrap { display: flex; justify-content: center; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; overflow: hidden; }
.pl-preview-frame { width: 100%; height: 66vh; border: 0; display: block; background: #fff; }
.pl-preview-frame.is-mobile { width: 390px; max-width: 100%; height: 66vh; }
.pl-preview-bar { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 10px; }
.pl-preview-url { flex: 1 1 220px; min-width: 140px; height: 30px; display: flex; align-items: center; padding: 0 9px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-seg { display: inline-flex; padding: 2px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base); gap: 2px; }
.pl-seg button { display: inline-flex; align-items: center; gap: 4px; height: 25px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-tertiary); font-family: inherit; font-size: 11.5px; cursor: pointer; }
.pl-seg button.is-active { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0,0,0,.12); }
.pl-divider { height: 1px; background: var(--dsw-alias-border-l2); margin: 2px 0; }
.pl-actions-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.pl-meta-row { min-height: 34px; }
.pl-meta-row .pl-chip { height: 24px; }
.pl-meta-row .pl-code { display: inline-block; height: 34px; padding: 0 8px; font-size: 12px; line-height: 32px; box-sizing: border-box; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.pl-meta-row .pl-btn { height: 34px; }
.pl-chip { display: inline-flex; align-items: center; gap: 4px; height: 21px; padding: 0 7px; border-radius: 999px; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); font-size: 11px; }
.pl-chip-warn { color: var(--dsw-alias-state-warning-primary); }
.pl-chip-ok { color: var(--dsw-alias-state-success-primary); }
.pl-card .pl-btn-danger { border-color: transparent; }
@keyframes pl-spin { to { transform: rotate(360deg); } }
@keyframes pl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes pl-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 720px) {
  .pl-inner { padding: 18px 16px 72px; }
  .pl-header { flex-direction: column; }
  .pl-head-actions { width: 100%; }
  .pl-head-actions .pl-btn-primary { flex: 1; }
  .pl-grid { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
}
`

    // ── searchable branch picker ────────────────────────────────────────────

    function BranchSelect(props) {
      const t = props.t
      const [open, setOpen] = React.useState(false)
      const [query, setQuery] = React.useState('')
      const [rect, setRect] = React.useState(null)
      const triggerRef = React.useRef(null)
      const popRef = React.useRef(null)
      const inputRef = React.useRef(null)

      const openPop = () => {
        const node = triggerRef.current
        if (node && typeof node.getBoundingClientRect === 'function') {
          const box = node.getBoundingClientRect()
          setRect({ top: box.bottom + 4, left: box.left, width: Math.max(box.width, 190) })
        }
        setQuery('')
        setOpen(true)
        if (props.onOpen) props.onOpen()
      }

      React.useEffect(() => {
        if (!open) return undefined
        const timer = setTimeout(() => {
          if (inputRef.current) inputRef.current.focus()
        }, 0)
        const onDocDown = (event) => {
          const target = event.target
          if (triggerRef.current && triggerRef.current.contains(target)) return
          if (popRef.current && popRef.current.contains(target)) return
          setOpen(false)
        }
        const onKey = (event) => {
          if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDocDown)
        document.addEventListener('keydown', onKey)
        return () => {
          clearTimeout(timer)
          document.removeEventListener('mousedown', onDocDown)
          document.removeEventListener('keydown', onKey)
        }
      }, [open])

      const keyword = query.trim().toLowerCase()
      const list = keyword
        ? (props.options || []).filter((item) => item.name.toLowerCase().includes(keyword))
        : props.options || []
      const pick = (name) => {
        setOpen(false)
        if (name && name !== props.value) props.onPick(name)
      }

      return h(
        React.Fragment,
        null,
        h(
          'button',
          {
            ref: triggerRef,
            type: 'button',
            className: 'pl-branch-picker' + (open ? ' is-open' : ''),
            title: props.title || t('branch'),
            disabled: props.disabled,
            onClick: () => (open ? setOpen(false) : openPop()),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (open) setOpen(false)
                else openPop()
              }
            },
          },
          h('span', { className: 'pl-branch-picker-text' }, props.value || t('noBranch')),
          h(Icon, { name: 'chevron', size: 13, style: { flex: 'none', opacity: 0.55 } }),
        ),
        open && rect
          ? h(
              'div',
              { ref: popRef, className: 'pl-branch-pop', style: { top: rect.top, left: rect.left, width: rect.width } },
              h('input', {
                ref: inputRef,
                className: 'pl-input pl-branch-search',
                value: query,
                placeholder: t('searchBranch'),
                spellCheck: false,
                onChange: (event) => setQuery(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' && list.length > 0) pick(list[0].name)
                },
              }),
              h(
                'div',
                { className: 'pl-branch-options' },
                list.length === 0
                  ? h('div', { className: 'pl-hint pl-branch-empty' }, props.loading ? '…' : t('noMatchingBranch'))
                  : list.map((item) =>
                      h(
                        'button',
                        {
                          key: item.name,
                          type: 'button',
                          className: 'pl-branch-option' + (item.name === props.value ? ' is-current' : ''),
                          onClick: () => pick(item.name),
                        },
                        h('span', { className: 'pl-branch-option-name', title: item.name }, item.name),
                        item.name === props.value ? h(Icon, { name: 'check', size: 12 }) : null,
                      ),
                    ),
              ),
            )
          : null,
      )
    }

    // ── prototype card ──────────────────────────────────────────────────────

    function PrototypeCard(props) {
      const t = props.t
      const prototype = props.prototype
      const runtime = props.runtime
      const status = statusOf(runtime)
      const busy = props.busy
      const currentBranch = (prototype.cache && prototype.cache.git && prototype.cache.git.branch) || ''
      const cachedGit = (prototype.cache && prototype.cache.git) || {}
      // 未跟踪的构建产物（node_modules/.vite/deps 之类）不算脏，否则卡片会一直提示有改动
      const dirty = Boolean(cachedGit.dirtyCount ?? cachedGit.changedCount ?? 0)
      const [branches, setBranches] = React.useState(null)
      const [loadingBranches, setLoadingBranches] = React.useState(false)

      const loadBranches = React.useCallback(async () => {
        if (branches || loadingBranches) return
        setLoadingBranches(true)
        try {
          const data = await api(`/prototypes/${prototype.id}/branches`)
          setBranches(data)
        } catch {
          setBranches({ local: [], remote: [] })
        } finally {
          setLoadingBranches(false)
        }
      }, [branches, loadingBranches, prototype.id])

      const options = React.useMemo(() => {
        if (!branches) return currentBranch ? [{ name: currentBranch, label: currentBranch }] : []
        const seen = new Set()
        const list = []
        if (currentBranch) {
          seen.add(currentBranch)
          list.push({ name: currentBranch, label: currentBranch })
        }
        for (const item of branches.local || []) {
          if (seen.has(item.name)) continue
          seen.add(item.name)
          list.push({ name: item.name, label: item.name })
        }
        for (const item of branches.remote || []) {
          if (seen.has(item.name)) continue
          seen.add(item.name)
          list.push({ name: item.name, label: item.name })
        }
        return list
      }, [branches, currentBranch])

      const canBranch = Boolean(prototype.cache && prototype.cache.git && prototype.cache.git.hasGit)
      const pinned = Boolean(prototype.pinned)

      return h(
        'article',
        { className: 'pl-card' + (pinned ? ' is-pinned' : '') },
        h(
          'div',
          { className: 'pl-thumb', onClick: () => props.onDetail(prototype.id), role: 'button', tabIndex: 0, onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') props.onDetail(prototype.id) } },
          h(Thumb, { prototype }),
          h(StatusBadge, { status, t }),
          pinned ? h('span', { className: 'pl-pin-badge', title: t('pinnedLabel') }, h(Icon, { name: 'pin', size: 11 })) : null,
          h(
            'div',
            { className: 'pl-thumb-hover' },
            h(
              'button',
              {
                type: 'button',
                className: 'pl-pin-btn' + (pinned ? ' is-pinned' : ''),
                title: pinned ? t('unpin') : t('pin'),
                disabled: busy === 'pin',
                onClick: (event) => { event.stopPropagation(); props.onTogglePin(prototype.id) },
              },
              h(Icon, { name: pinned ? 'pinOff' : 'pin', size: 13 }),
              h('span', null, pinned ? t('unpin') : t('pin')),
            ),
          ),
        ),
        h(
          'div',
          { className: 'pl-card-body' },
          h(
            'div',
            { className: 'pl-card-head' },
            h('h3', { className: 'pl-name', title: prototype.name }, prototype.name),
            h('button', { type: 'button', className: 'pl-icon-btn', title: t('details'), onClick: () => props.onDetail(prototype.id) }, h(Icon, { name: 'chevron', size: 14, style: { transform: 'rotate(-90deg)' } })),
          ),
          h(
            'div',
            { className: 'pl-card-meta' },
            h('span', { className: 'pl-tag', title: prototype.project || t('ungrouped') }, prototype.project || t('ungrouped')),
            h('span', { className: 'pl-meta-dot' }),
            h('span', null, kindLabel(prototype.kind)),
            h('span', { className: 'pl-meta-dot' }),
            h('span', { title: new Date(prototype.updatedAt || Date.now()).toLocaleString() }, timeAgo(t, prototype.updatedAt)),
          ),
          h(
            'div',
            { className: 'pl-branch-row' },
            h(BranchSelect, {
              t,
              value: currentBranch,
              options,
              loading: loadingBranches,
              disabled: !canBranch || busy || status === 'starting',
              title: canBranch ? (dirty ? t('worktreeDirty') : t('branch')) : t('noBranch'),
              onOpen: loadBranches,
              onPick: (branch) => props.onSwitch(prototype.id, branch),
            }),
          ),
          h(
            'div',
            { className: 'pl-card-actions' },
            status === 'running'
              ? h(Button, { size: 'sm', icon: 'stop', onClick: () => props.onStop(prototype.id), busy: busy === 'stop' }, t('stop'))
              : h(Button, { size: 'sm', icon: 'play', variant: status === 'stopped' ? 'primary' : 'secondary', onClick: () => props.onStart(prototype.id), busy: busy === 'start' || status === 'starting', disabled: status === 'starting' }, status === 'starting' ? t('statusStarting') : t('start')),
            h(Button, { size: 'sm', icon: 'eye', onClick: () => props.onPreview(prototype.id), disabled: status === 'starting' }, t('preview')),
            h('span', { className: 'pl-grow' }),
            dirty ? h('span', { className: 'pl-chip pl-chip-warn', title: t('dirty') }, h(Icon, { name: 'dot', size: 9 }), t('dirty')) : null,
          ),
        ),
      )
    }

    // ── import modal ────────────────────────────────────────────────────────

    function ImportModal(props) {
      const t = props.t
      const [dir, setDir] = React.useState('')
      const [name, setName] = React.useState('')
      const [project, setProject] = React.useState('')
      const [repoUrl, setRepoUrl] = React.useState('')
      const [command, setCommand] = React.useState('')
      const [info, setInfo] = React.useState(null)
      const [thumbMode, setThumbMode] = React.useState('auto')
      const [thumbPath, setThumbPath] = React.useState('')
      const [inspecting, setInspecting] = React.useState(false)
      const [creating, setCreating] = React.useState(false)
      const [error, setError] = React.useState('')
      const [notice, setNotice] = React.useState('')

      const inspect = async (target, options) => {
        const path = String(target || dir || '').trim()
        const resetFields = Boolean(options && options.resetFields)
        if (!path) {
          setError(t('needDir'))
          return
        }
        setInspecting(true)
        setDir(path)
        setError('')
        setNotice('')
        try {
          const data = await api('/inspect-dir', { body: { path } })
          setDir(data.path || path)
          setInfo(data)
          if (resetFields || !name) setName(data.name || '')
          if (resetFields || !repoUrl) setRepoUrl(data.repoUrl || '')
          if (resetFields || !command) setCommand(data.command || '')
          if (data.images && data.images.length > 0) {
            setThumbMode('image')
            setThumbPath(data.images[0].path)
          } else {
            setThumbMode('auto')
            setThumbPath('')
          }
        } catch (err) {
          setInfo(null)
          setError(errorMessage(t, err))
        } finally {
          setInspecting(false)
        }
      }

      const browse = async () => {
        setError('')
        setNotice('')
        setInspecting(true)
        try {
          const picked = await api('/dir/pick', { body: {} })
          if (picked.kind === 'native' && picked.path) {
            await inspect(picked.path, { resetFields: true })
          } else if (picked.kind === 'unavailable') {
            setError(t('pickerUnavailable'))
          } else if (picked.kind === 'error') {
            setError(picked.message || t('browseFailed'))
          }
        } catch (err) {
          setError(errorMessage(t, err))
        } finally {
          setInspecting(false)
        }
      }

      const submit = async () => {
        if (!info) {
          setError(t('needDir'))
          return
        }
        setCreating(true)
        setError('')
        try {
          const created = await api('/prototypes', {
            body: {
              dir: info.path,
              name: name.trim() || info.name,
              project: project.trim() || t('ungrouped'),
              repoUrl: repoUrl.trim(),
              command: command.trim(),
              thumbnailPath: thumbMode === 'image' ? thumbPath : undefined,
            },
          })
          props.onImported(created)
        } catch (err) {
          setError(errorMessage(t, err))
        } finally {
          setCreating(false)
        }
      }

      return h(
        Modal,
        {
          t,
          large: true,
          title: t('importTitle'),
          subtitle: t('importDesc'),
          onClose: props.onClose,
          footer: [
            h(Button, { key: 'cancel', onClick: props.onClose }, t('cancel')),
            h(Button, { key: 'submit', variant: 'primary', icon: 'plus', onClick: submit, busy: creating, disabled: !info }, creating ? t('creating') : t('create')),
          ],
        },
        h(
          'div',
          { className: 'pl-form' },
          h(
            Field,
            { label: t('dir'), hint: t('inspectHint') },
            h(
              'div',
              { style: { display: 'flex', gap: 7 } },
              h('input', { className: 'pl-input', value: dir, placeholder: t('dirPlaceholder'), readOnly: true, onClick: browse, spellCheck: false, title: dir || t('browse'), style: { cursor: 'pointer' } }),
              h(Button, { icon: 'folder', onClick: browse, busy: inspecting, title: t('browse') }, t('browse')),
            ),
          ),
          notice ? h('div', { className: 'pl-hint' }, notice) : null,
          info
            ? h(
                'div',
                { className: 'pl-actions-row' },
                h('span', { className: 'pl-chip pl-chip-ok' }, h(Icon, { name: 'check', size: 11 }), kindLabel(info.kind)),
                info.hasGit ? h('span', { className: 'pl-chip' }, h(Icon, { name: 'branch', size: 11 }), info.branch || t('noBranch')) : h('span', { className: 'pl-chip pl-chip-warn' }, t('noGitTitle')),
                info.packageName ? h('span', { className: 'pl-chip' }, info.packageName) : null,
              )
            : null,
          h(
            'div',
            { className: 'pl-form-row' },
            h(Field, { label: t('name') }, h('input', { className: 'pl-input', value: name, placeholder: info ? info.name : '', onChange: (event) => setName(event.target.value) })),
            h(
              Field,
              { label: t('projectLabel') },
              h('input', {
                className: 'pl-input',
                value: project,
                placeholder: t('projectPlaceholder'),
                list: 'pl-project-options',
                onChange: (event) => setProject(event.target.value),
              }),
              h('datalist', { id: 'pl-project-options' }, (props.projects || []).map((item) => h('option', { key: item, value: item }))),
            ),
          ),
          h(Field, { label: t('repoUrl'), hint: t('repoOptional') }, h('input', { className: 'pl-input', value: repoUrl, placeholder: t('repoUrlPlaceholder'), onChange: (event) => setRepoUrl(event.target.value), spellCheck: false })),
          h(Field, { label: t('command'), hint: t('commandPlaceholder') }, h('input', { className: 'pl-input', value: command, placeholder: t('commandPlaceholder'), onChange: (event) => setCommand(event.target.value), spellCheck: false })),
          h(
            Field,
            { label: t('thumbnail') },
            h(
              'div',
              { className: 'pl-radios' },
              h(
                'label',
                { className: `pl-radio ${thumbMode === 'auto' ? 'is-active' : ''}` },
                h('input', { type: 'radio', name: 'thumbMode', checked: thumbMode === 'auto', onChange: () => setThumbMode('auto') }),
                h('span', null, t('thumbAuto'), h('small', null, t('thumbAutoDesc'))),
              ),
              info && info.images && info.images.length > 0
                ? h(
                    'label',
                    { className: `pl-radio ${thumbMode === 'image' ? 'is-active' : ''}` },
                    h('input', { type: 'radio', name: 'thumbMode', checked: thumbMode === 'image', onChange: () => setThumbMode('image') }),
                    h('span', null, t('thumbPick'), h('small', null, `${info.images.length}`)),
                  )
                : null,
            ),
            thumbMode === 'image' && info && info.images && info.images.length > 0
              ? h(
                  'div',
                  { className: 'pl-image-grid', style: { marginTop: 6 } },
                  info.images.map((image) =>
                    h(
                      'button',
                      {
                        key: image.path,
                        type: 'button',
                        className: `pl-image-option ${thumbPath === image.path ? 'is-active' : ''}`,
                        title: image.rel,
                        onClick: () => setThumbPath(image.path),
                      },
                      h('img', { src: `${API}/image?path=${encodeURIComponent(image.path)}`, alt: image.name, onError: (event) => { event.currentTarget.style.display = 'none' } }),
                      h('span', null, image.rel),
                    ),
                  ),
                )
              : null,
          ),
          error ? h('div', { className: 'pl-warn pl-warn-error' }, h(Icon, { name: 'alert', size: 14 }), h('span', null, error)) : null,
        ),
      )
    }

    // ── commit modal ────────────────────────────────────────────────────────

    function CommitModal(props) {
      const t = props.t
      const detail = props.detail
      const prototype = props.prototype
      const git = detail.git || {}
      const [message, setMessage] = React.useState('')
      const [mode, setMode] = React.useState('commit')
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState('')
      const [result, setResult] = React.useState(null)

      const submit = async () => {
        if (!message.trim()) {
          setError(t('message'))
          return
        }
        setBusy(true)
        setError('')
        try {
          const data = await api(`/prototypes/${prototype.id}/git/commit`, { body: { message: message.trim(), push: mode === 'push' } })
          setResult(data)
          props.onDone(data)
        } catch (err) {
          setError(errorMessage(t, err))
        } finally {
          setBusy(false)
        }
      }

      if (result) {
        const push = result.push
        return h(
          Modal,
          {
            t,
            title: t('commitTitle'),
            onClose: props.onClose,
            footer: h(Button, { variant: 'primary', onClick: props.onClose }, t('done')),
          },
          h(
            'div',
            { className: 'pl-form' },
            h('div', { className: 'pl-warn pl-warn-ok' }, h(Icon, { name: 'check', size: 14 }), h('span', null, `${t('committed')} · ${result.hash || ''} ${result.subject || ''}`)),
            push
              ? push.ok
                ? h('div', { className: 'pl-warn pl-warn-ok' }, h(Icon, { name: 'check', size: 14 }), h('span', null, `${t('pushed')} · ${git.branch || ''}`))
                : h(
                    'div',
                    { className: 'pl-warn pl-warn-error' },
                    h(Icon, { name: 'alert', size: 14 }),
                    h('div', null, h('div', null, `${t('pushFailed')}：${push.message || ''}`), h('div', { className: 'pl-hint' }, t('pushRetry')), push.details ? h('pre', { className: 'pl-log', style: { marginTop: 6 } }, push.details) : null),
                  )
              : null,
          ),
        )
      }

      return h(
        Modal,
        {
          t,
          title: t('commitTitle'),
          subtitle: t('commitDesc'),
          onClose: props.onClose,
          footer: [
            h(Button, { key: 'cancel', onClick: props.onClose }, t('cancel')),
            h(Button, { key: 'submit', variant: 'primary', icon: 'commit', onClick: submit, busy, disabled: !git.changedCount }, t('submit')),
          ],
        },
        h(
          'div',
          { className: 'pl-form' },
          h(Field, { label: t('message'), hint: t('commitScope') }, h('textarea', { className: 'pl-textarea', value: message, placeholder: t('messagePlaceholder'), onChange: (event) => setMessage(event.target.value), autoFocus: true })),
          h(
            'div',
            { className: 'pl-radios' },
            h(
              'label',
              { className: `pl-radio ${mode === 'commit' ? 'is-active' : ''}` },
              h('input', { type: 'radio', name: 'commitMode', checked: mode === 'commit', onChange: () => setMode('commit') }),
              h('span', null, t('onlyCommit')),
            ),
            h(
              'label',
              { className: `pl-radio ${mode === 'push' ? 'is-active' : ''}` },
              h('input', { type: 'radio', name: 'commitMode', checked: mode === 'push', onChange: () => setMode('push') }),
              h('span', null, t('commitAndPush')),
            ),
          ),
          git.changedCount
            ? h('div', { className: 'pl-actions-row' }, h('span', { className: 'pl-chip' }, fmt(t('changedFiles'), { n: git.changedCount })), h('span', { className: 'pl-chip' }, h(Icon, { name: 'branch', size: 11 }), git.branch || t('noBranch')))
            : h('div', { className: 'pl-warn' }, h(Icon, { name: 'check', size: 14 }), h('span', null, t('noChanges'))),
          error ? h('div', { className: 'pl-warn pl-warn-error' }, h(Icon, { name: 'alert', size: 14 }), h('span', null, error)) : null,
        ),
      )
    }

    // ── new branch modal ────────────────────────────────────────────────────

    function NewBranchModal(props) {
      const t = props.t
      const [name, setName] = React.useState('')
      const [base, setBase] = React.useState('')
      const [branches, setBranches] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState('')
      const current = (props.prototype.cache && props.prototype.cache.git && props.prototype.cache.git.branch) || ''
      React.useEffect(() => {
        let alive = true
        api(`/prototypes/${props.prototype.id}/branches`)
          .then((data) => { if (alive) setBranches(data || { local: [], remote: [] }) })
          .catch(() => { if (alive) setBranches({ local: [], remote: [] }) })
        return () => { alive = false }
      }, [props.prototype.id])
      const baseOptions = React.useMemo(() => {
        const items = [h('option', { value: '', key: 'current' }, fmt(t('baseBranchCurrent'), { name: current || t('noBranch') }))]
        for (const item of (branches && branches.local) || []) {
          if (!item.name || item.name === current) continue
          items.push(h('option', { value: item.name, key: `l:${item.name}` }, item.name))
        }
        for (const item of (branches && branches.remote) || []) {
          if (!item.name) continue
          items.push(h('option', { value: item.name, key: `r:${item.name}` }, item.name))
        }
        return items
      }, [branches, current, t])
      return h(
        Modal,
        {
          t,
          title: t('newBranchTitle'),
          subtitle: t('newBranchDesc'),
          onClose: props.onClose,
          footer: [
            h(Button, { key: 'cancel', onClick: props.onClose }, t('cancel')),
            h(Button, { key: 'submit', variant: 'primary', icon: 'branch', busy, onClick: async () => {
              if (!name.trim()) return
              setBusy(true)
              setError('')
              try {
                await api(`/prototypes/${props.prototype.id}/git/branch`, { body: { name: name.trim(), base: base || undefined } })
                props.onCreated(name.trim())
              } catch (err) {
                setError(errorMessage(t, err))
              } finally {
                setBusy(false)
              }
            } }, t('createBranch')),
          ],
        },
        h(
          'div',
          { className: 'pl-form' },
          h(Field, { label: t('branchName') }, h('input', { className: 'pl-input', value: name, placeholder: t('branchPlaceholder'), onChange: (event) => setName(event.target.value), autoFocus: true, spellCheck: false })),
          h(Field, { label: t('baseBranch'), hint: t('baseBranchHint') }, h('select', { className: 'pl-select', value: base, onChange: (event) => setBase(event.target.value) }, baseOptions)),
          error ? h('div', { className: 'pl-warn pl-warn-error' }, h(Icon, { name: 'alert', size: 14 }), h('span', null, error)) : null,
        ),
      )
    }

    // ── preview modal ───────────────────────────────────────────────────────

    function PreviewModal(props) {
      const t = props.t
      const [device, setDevice] = React.useState('desktop')
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState('')
      const runtime = props.runtime
      const running = runtime && runtime.status === 'running'
      const url = runtime && runtime.url

      const start = async () => {
        setBusy(true)
        setError('')
        try {
          await props.onStart()
        } catch (err) {
          setError(errorMessage(t, err))
        } finally {
          setBusy(false)
        }
      }

      return h(
        Modal,
        {
          t,
          wide: true,
          title: props.prototype.name,
          subtitle: running ? url : t('previewNotRunning'),
          onClose: props.onClose,
          footer: running
            ? [
                h(Button, { key: 'stop', icon: 'stop', onClick: props.onStop, busy: busy }, t('stop')),
                h(Button, { key: 'restart', icon: 'refresh', onClick: props.onRestart, busy }, t('restart')),
                h('span', { key: 'grow', style: { flex: 1 } }),
                h('a', { key: 'open', className: 'pl-btn', href: url, target: '_blank', rel: 'noreferrer noopener' }, h(Icon, { name: 'external', size: 14 }), t('openExternal')),
              ]
            : [h(Button, { key: 'close', onClick: props.onClose }, t('close'))],
        },
        h(
          'div',
          null,
          h(
            'div',
            { className: 'pl-preview-bar' },
            h('span', { className: 'pl-preview-url' }, running ? url : '—'),
            h(
              'div',
              { className: 'pl-seg' },
              h('button', { type: 'button', className: device === 'desktop' ? 'is-active' : '', onClick: () => setDevice('desktop'), title: t('deviceDesktop') }, h(Icon, { name: 'monitor', size: 13 }), t('deviceDesktop')),
              h('button', { type: 'button', className: device === 'mobile' ? 'is-active' : '', onClick: () => setDevice('mobile'), title: t('deviceMobile') }, h(Icon, { name: 'phone', size: 13 }), t('deviceMobile')),
            ),
            running ? h(Button, { icon: 'refresh', onClick: () => props.onReload(), title: t('refresh') }, t('refresh')) : null,
          ),
          running
            ? h('div', { className: 'pl-preview-frame-wrap' }, h('iframe', { key: props.frameKey, className: `pl-preview-frame ${device === 'mobile' ? 'is-mobile' : ''}`, src: url, title: props.prototype.name, allow: 'clipboard-read; clipboard-write' }))
            : h(
                'div',
                { className: 'pl-empty' },
                h('div', { className: 'pl-empty-icon' }, h(Icon, { name: 'play', size: 24 })),
                h('h3', null, t('previewNotRunning')),
                h('p', null, url || ''),
                h(Button, { variant: 'primary', icon: 'play', onClick: start, busy }, busy ? t('statusStarting') : t('startPreview')),
              ),
          error ? h('div', { className: 'pl-warn pl-warn-error', style: { marginTop: 10 } }, h(Icon, { name: 'alert', size: 14 }), h('span', null, error)) : null,
        ),
      )
    }

    // ── confirm modal ───────────────────────────────────────────────────────

    function ConfirmModal(props) {
      const t = props.t
      return h(
        Modal,
        {
          t,
          title: props.title,
          onClose: props.onClose,
          footer: [
            h(Button, { key: 'cancel', onClick: props.onClose }, t('cancel')),
            h(Button, { key: 'confirm', variant: 'danger', onClick: props.onConfirm, busy: props.busy }, props.confirmLabel || t('confirmRemove')),
          ],
        },
        h('div', { className: 'pl-form' }, h('p', { style: { margin: 0, color: 'var(--dsw-alias-label-secondary)' } }, props.desc), props.hint ? h('div', { className: 'pl-hint' }, props.hint) : null),
      )
    }

    // ── detail modal ────────────────────────────────────────────────────────

    function DetailModal(props) {
      const t = props.t
      const [detail, setDetail] = React.useState(null)
      const [loading, setLoading] = React.useState(true)
      const [error, setError] = React.useState('')
      const [busy, setBusy] = React.useState('')
      const [draftName, setDraftName] = React.useState('')
      const [draftProject, setDraftProject] = React.useState('')
      const [draftRepo, setDraftRepo] = React.useState('')
      const [showCommit, setShowCommit] = React.useState(false)
      const [showBranch, setShowBranch] = React.useState(false)
      const [confirmRemove, setConfirmRemove] = React.useState(false)
      const [showLogs, setShowLogs] = React.useState(true)
      const [tab, setTab] = React.useState('git')
      const [branchQuery, setBranchQuery] = React.useState('')
      const initialized = React.useRef(false)
      const fileInput = React.useRef(null)
      const logRef = React.useRef(null)

      React.useEffect(() => {
        const el = logRef.current
        if (el) el.scrollTop = el.scrollHeight
      }, [detail, showLogs, tab])

      const load = React.useCallback(
        async (silent) => {
          if (!silent) setLoading(true)
          try {
            const data = await api(`/prototypes/${props.prototypeId}?logs=1`)
            setDetail(data)
            setError('')
            if (!initialized.current) {
              initialized.current = true
              setDraftName(data.prototype.name || '')
              setDraftProject(data.prototype.project || '')
              setDraftRepo((data.git && data.git.remoteUrl) || data.prototype.repoUrl || '')
            }
          } catch (err) {
            if (!silent) setError(errorMessage(t, err))
          } finally {
            if (!silent) setLoading(false)
          }
        },
        [props.prototypeId, t],
      )

      React.useEffect(() => {
        let alive = true
        initialized.current = false
        const tick = async () => {
          try {
            const data = await api(`/prototypes/${props.prototypeId}?logs=1`)
            if (!alive) return
            setDetail(data)
            setError('')
            if (!initialized.current) {
              initialized.current = true
              setDraftName(data.prototype.name || '')
              setDraftProject(data.prototype.project || '')
              setDraftRepo((data.git && data.git.remoteUrl) || data.prototype.repoUrl || '')
            }
          } catch (err) {
            if (alive && !detail) setError(errorMessage(t, err))
          } finally {
            if (alive) setLoading(false)
          }
        }
        tick()
        const timer = setInterval(tick, 5000)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [props.prototypeId])

      const notify = props.notify

      const run = async (key, action, success) => {
        setBusy(key)
        try {
          const result = await action()
          if (success) notify(success, 'success')
          await load(true)
          props.onChanged()
          return result
        } catch (err) {
          notify(errorMessage(t, err), 'error')
          throw err
        } finally {
          setBusy('')
        }
      }

      const saveMeta = () =>
        run('save', async () => {
          await api(`/prototypes/${props.prototypeId}`, { method: 'PATCH', body: { name: draftName.trim(), project: draftProject.trim() } })
        }, t('saved')).catch(() => {})

      const bindRepo = () =>
        run('repo', async () => {
          await api(`/prototypes/${props.prototypeId}`, { method: 'PATCH', body: { repoUrl: draftRepo.trim() } })
        }, t('repoBound')).catch(() => {})

      const initRepo = () =>
        run('init', async () => {
          await api(`/prototypes/${props.prototypeId}/git/init`, { body: { repoUrl: draftRepo.trim(), gitignore: true } })
        }, t('initRepo')).catch(() => {})

      const fetchRepo = () =>
        run('fetch', async () => {
          await api(`/prototypes/${props.prototypeId}/git/fetch`, { body: {} })
        }, t('fetch')).catch(() => {})

      const switchBranch = (branch) =>
        run(`switch:${branch}`, async () => {
          const result = await api(`/prototypes/${props.prototypeId}/git/switch`, { body: { branch } })
          const key = result && result.repaired ? 'switchRepaired' : 'switchSuccess'
          notify(fmt(t(key), { name: branch }), 'success')
          return result
        }, null).catch(() => {})

      const start = () => run('start', () => api(`/prototypes/${props.prototypeId}/start`, { body: {} }), t('started')).catch(() => {})
      const stop = () => run('stop', () => api(`/prototypes/${props.prototypeId}/stop`, { body: {} }), t('stopped')).catch(() => {})
      const restart = () => run('restart', () => api(`/prototypes/${props.prototypeId}/restart`, { body: {} }), t('started')).catch(() => {})
      const capture = () =>
        run('capture', async () => {
          await api(`/prototypes/${props.prototypeId}/thumbnail/capture`, { body: {} })
        }, t('capture')).catch(() => {})

      const uploadThumb = async (event) => {
        const file = event.target.files && event.target.files[0]
        event.target.value = ''
        if (!file) return
        if (file.size > 8 * 1024 * 1024) {
          notify(t('imageHint'), 'error')
          return
        }
        setBusy('upload')
        try {
          const dataUrl = await readFileAsDataUrl(file)
          await api(`/prototypes/${props.prototypeId}/thumbnail`, { body: { dataUrl } })
          notify(t('saved'), 'success')
          await load(true)
          props.onChanged()
        } catch (err) {
          notify(errorMessage(t, err), 'error')
        } finally {
          setBusy('')
        }
      }

      const removeThumb = () =>
        run('thumb-remove', async () => {
          await api(`/prototypes/${props.prototypeId}/thumbnail`, { method: 'DELETE' })
        }, t('saved')).catch(() => {})

      const remove = async () => {
        setBusy('remove')
        try {
          await api(`/prototypes/${props.prototypeId}`, { method: 'DELETE' })
          notify(t('remove'), 'success')
          props.onChanged()
          props.onClose()
        } catch (err) {
          notify(errorMessage(t, err), 'error')
        } finally {
          setBusy('')
        }
      }

      const openDir = () => run('open', () => api(`/prototypes/${props.prototypeId}/reveal`, { body: {} })).catch(() => {})

      const prototype = detail && detail.prototype
      const git = (detail && detail.git) || {}
      const runtime = detail && detail.runtime
      const branches = (detail && detail.branches) || { local: [], remote: [] }
      const running = runtime && runtime.status === 'running'
      const starting = runtime && runtime.status === 'starting'
      const branchKeyword = branchQuery.trim().toLowerCase()
      const filterBranchList = (list) => (branchKeyword ? (list || []).filter((item) => item.name.toLowerCase().includes(branchKeyword)) : list || [])
      const localBranches = filterBranchList(branches.local)
      const remoteBranches = filterBranchList(branches.remote)
      const branchTotal = (branches.local || []).length + (branches.remote || []).length

      return h(
        Modal,
        {
          t,
          wide: true,
          bodyFixed: true,
          title: prototype ? prototype.name : t('loading'),
          onClose: props.onClose,
          footer: [
            h(Button, { key: 'close', onClick: props.onClose }, t('close')),
            running
              ? h(Button, { key: 'stop', icon: 'stop', onClick: stop, busy: busy === 'stop' }, t('stop'))
              : h(Button, { key: 'start', icon: 'play', variant: 'primary', onClick: start, busy: busy === 'start' || starting, disabled: starting }, starting ? t('statusStarting') : t('start')),
            h(Button, { key: 'commit', icon: 'commit', onClick: () => setShowCommit(true), disabled: !git.hasGit || !git.changedCount }, t('commit')),
          ],
        },
        loading && !detail
          ? h('div', { className: 'pl-loading' }, h(Spinner), t('loading'))
          : error && !detail
            ? h('div', { className: 'pl-error' }, h('h3', null, t('errorTitle')), h('p', null, error), h(Button, { onClick: () => load() }, t('retry')))
            : prototype
              ? h(
                  'div',
                  { className: 'pl-tabs-body' },
                  h(
                    'div',
                    { className: 'pl-tabs', role: 'tablist' },
                    h('button', { type: 'button', className: 'pl-tab' + (tab === 'git' ? ' is-active' : ''), onClick: () => setTab('git') }, t('tabGit')),
                    h('button', { type: 'button', className: 'pl-tab' + (tab === 'preview' ? ' is-active' : ''), onClick: () => setTab('preview') }, t('tabPreview')),
                    h('button', { type: 'button', className: 'pl-tab' + (tab === 'basic' ? ' is-active' : ''), onClick: () => setTab('basic') }, t('tabBasic')),
                  ),
                  h(
                    'div',
                    { className: 'pl-section' + (tab === 'basic' ? '' : ' pl-tab-hidden') },
                    h(
                      'div',
                      { className: 'pl-form-row' },
                      h(Field, { label: t('name') }, h('input', { className: 'pl-input', value: draftName, onChange: (event) => setDraftName(event.target.value) })),
                      h(Field, { label: t('projectLabel') }, h('input', { className: 'pl-input', value: draftProject, onChange: (event) => setDraftProject(event.target.value) })),
                      h('div', { style: { display: 'flex', alignItems: 'flex-end' } }, h(Button, { icon: 'save', onClick: saveMeta, busy: busy === 'save' }, t('save'))),
                    ),
                    h(
                      'div',
                      { className: 'pl-actions-row pl-meta-row' },
                      h('span', { className: 'pl-chip' }, kindLabel(prototype.kind)),
                      h('code', { className: 'pl-code', style: { overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: '0 1 auto' }, title: prototype.dir }, prototype.dir),
                      h(Button, { icon: 'folder', onClick: openDir }, t('openDir')),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'pl-section' + (tab === 'basic' ? '' : ' pl-tab-hidden') },
                    h('div', { className: 'pl-section-head' }, h('h3', { className: 'pl-section-title' }, h(Icon, { name: 'camera', size: 13 }), t('thumbnail'))),
                    h(
                      'div',
                      { className: 'pl-thumb-current' },
                      h(
                        'div',
                        { className: 'pl-thumb-preview' },
                        prototype.thumbnailUrl
                          ? h('img', { src: prototype.thumbnailUrl, alt: prototype.name, onError: (event) => { event.currentTarget.style.display = 'none' } })
                          : h('div', { className: 'pl-thumb-fallback' }, h('span', { className: 'pl-thumb-letter' }, (prototype.name || '?').slice(0, 1).toUpperCase())),
                      ),
                      h(
                        'div',
                        { className: 'pl-actions-row' },
                        h(Button, { icon: 'upload', onClick: () => fileInput.current && fileInput.current.click(), busy: busy === 'upload' }, t('upload')),
                        h(Button, { icon: 'camera', onClick: capture, busy: busy === 'capture', disabled: !running, title: running ? t('capture') : t('notRunning') }, t('capture')),
                        prototype.thumbnailUrl ? h(Button, { icon: 'trash', variant: 'ghost', onClick: removeThumb, busy: busy === 'thumb-remove' }, t('removeThumb')) : null,
                        h('input', { ref: fileInput, type: 'file', accept: 'image/png,image/jpeg,image/webp', className: 'pl-file-input', onChange: uploadThumb }),
                      ),
                    ),
                    h('div', { className: 'pl-hint' }, running ? t('imageHint') : t('notRunning')),
                  ),
                  h(
                    'div',
                    { className: 'pl-section' + (tab === 'git' ? '' : ' pl-tab-hidden') },
                    h('div', { className: 'pl-section-head' }, h('h3', { className: 'pl-section-title' }, h(Icon, { name: 'branch', size: 13 }), t('gitTitle')), git.hasGit ? h('span', { className: 'pl-chip' }, git.branch || t('noBranch')) : null),
                    git.hasGit
                      ? h(
                          'div',
                          { className: 'pl-form' },
                          h(
                            'div',
                            { className: 'pl-actions-row' },
                            h('span', { className: 'pl-chip' }, git.clean || git.changedCount === 0 ? t('clean') : fmt(t('changedFiles'), { n: git.changedCount })),
                            git.ahead ? h('span', { className: 'pl-chip' }, fmt(t('ahead'), { n: git.ahead })) : null,
                            git.behind ? h('span', { className: 'pl-chip' }, fmt(t('behind'), { n: git.behind })) : null,
                            git.lastCommit ? h('span', { className: 'pl-hint', title: git.lastCommit.subject }, `${git.lastCommit.hash} ${git.lastCommit.subject}`) : h('span', { className: 'pl-hint' }, t('noCommits')),
                          ),
                          h(
                            'div',
                            { className: 'pl-form-row' },
                            h(Field, { label: t('gitRepo'), hint: git.remoteUrl ? '' : t('noRemote') }, h('input', { className: 'pl-input', value: draftRepo, placeholder: t('repoUrlPlaceholder'), onChange: (event) => setDraftRepo(event.target.value), spellCheck: false })),
                            h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 6, flex: 'none' } }, h(Button, { icon: 'save', onClick: bindRepo, busy: busy === 'repo' }, t('save')), h(Button, { icon: 'refresh', onClick: fetchRepo, busy: busy === 'fetch' }, t('fetch'))),
                          ),
                          h(
                            'div',
                            { className: 'pl-section-head' },
                            h('h3', { className: 'pl-section-title' }, t('branches')),
                            h(Button, { size: 'sm', icon: 'plus', onClick: () => setShowBranch(true) }, t('newBranch')),
                          ),
                          h(
                            'div',
                            { className: 'pl-branch-search-row' },
                            h(Icon, { name: 'search', size: 13, style: { flex: 'none', opacity: 0.55 } }),
                            h('input', {
                              className: 'pl-input pl-branch-search',
                              value: branchQuery,
                              placeholder: t('searchBranch'),
                              spellCheck: false,
                              onChange: (event) => setBranchQuery(event.target.value),
                            }),
                          ),
                          h(
                            'div',
                            { className: 'pl-branch-list' },
                            localBranches.map((item) =>
                              h(
                                'div',
                                { key: 'l:' + item.name, className: 'pl-branch-item' },
                                h(Icon, { name: item.current ? 'check' : 'branch', size: 13, style: { color: item.current ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-label-tertiary)' } }),
                                h('span', { className: 'pl-branch-name', title: item.hash }, item.name),
                                h('span', { className: 'pl-branch-kind' }, t('local')),
                                h('span', { className: 'pl-grow' }),
                                item.current ? null : h(Button, { size: 'sm', variant: 'ghost', onClick: () => switchBranch(item.name), busy: busy === `switch:${item.name}` }, t('switchBranch')),
                              ),
                            ),
                            (remoteBranches).map((item) =>
                              h(
                                'div',
                                { key: 'r:' + item.name, className: 'pl-branch-item' },
                                h(Icon, { name: 'branch', size: 13, style: { color: 'var(--dsw-alias-label-tertiary)' } }),
                                h('span', { className: 'pl-branch-name', title: item.hash }, item.name),
                                h('span', { className: 'pl-branch-kind' }, t('remote')),
                                h('span', { className: 'pl-grow' }),
                                h(Button, { size: 'sm', variant: 'ghost', onClick: () => switchBranch(item.name), busy: busy === `switch:${item.name}` }, t('switchBranch')),
                              ),
                            ),
                            branchTotal === 0
                              ? h('div', { className: 'pl-hint' }, t('noBranch'))
                              : localBranches.length + remoteBranches.length === 0
                                ? h('div', { className: 'pl-hint' }, t('noMatchingBranch'))
                                : null,
                          ),
                          (git.dirtyCount ?? git.changedCount) > 0 ? h('div', { className: 'pl-hint' }, t('worktreeDirty')) : null,
                        )
                      : h(
                          'div',
                          { className: 'pl-form' },
                          h('div', { className: 'pl-hint' }, t('noGitDesc')),
                          h(
                            'div',
                            { className: 'pl-form-row' },
                            h(Field, { label: t('gitRepo') }, h('input', { className: 'pl-input', value: draftRepo, placeholder: t('repoUrlPlaceholder'), onChange: (event) => setDraftRepo(event.target.value), spellCheck: false })),
                            h('div', { style: { display: 'flex', alignItems: 'flex-end', flex: 'none' } }, h(Button, { variant: 'primary', icon: 'commit', onClick: initRepo, busy: busy === 'init' }, t('initRepo'))),
                          ),
                          h('div', { className: 'pl-hint' }, t('initHint')),
                        ),
                  ),
                  h(
                    'div',
                    { className: 'pl-section' + (tab === 'preview' ? '' : ' pl-tab-hidden') },
                    h(
                      'div',
                      { className: 'pl-section-head' },
                      h('h3', { className: 'pl-section-title' }, h(Icon, { name: 'terminal', size: 13 }), t('runtime')),
                      h(
                        'div',
                        { className: 'pl-actions-row' },
                        running ? h(Button, { size: 'sm', icon: 'stop', onClick: stop, busy: busy === 'stop' }, t('stop')) : null,
                        running ? h(Button, { size: 'sm', icon: 'refresh', onClick: restart, busy: busy === 'restart' }, t('restart')) : null,
                        h(Button, { size: 'sm', icon: 'eye', onClick: () => props.onPreview(), disabled: !running }, t('preview')),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'pl-kv' },
                      h('dt', null, t('address')),
                      h('dd', null, runtime && runtime.url ? h('a', { href: runtime.url, target: '_blank', rel: 'noreferrer noopener', style: { color: 'var(--pl-accent)' } }, runtime.url) : '—'),
                      h('dt', null, t('port')),
                      h('dd', null, runtime && runtime.port ? String(runtime.port) : '—'),
                      runtime && runtime.error ? h('dt', null, t('statusError')) : null,
                      runtime && runtime.error ? h('dd', { style: { color: 'var(--dsw-alias-state-error-primary)' } }, runtime.error) : null,
                    ),
                    h(
                      'div',
                      { className: 'pl-section-head' },
                      h('h3', { className: 'pl-section-title' }, t('logs'), h('span', { className: 'pl-hint' }, t('logsHint'))),
                      h(Button, { size: 'sm', variant: 'ghost', onClick: () => setShowLogs(!showLogs) }, showLogs ? t('close') : t('logs')),
                    ),
                    showLogs ? h('pre', { className: 'pl-log', ref: logRef }, (detail && detail.logs) || t('noLogs')) : null,
                  ),
                  h(
                    'div',
                    { className: 'pl-section' + (tab === 'basic' ? '' : ' pl-tab-hidden') },
                    h('div', { className: 'pl-section-head' }, h('h3', { className: 'pl-section-title', style: { color: 'var(--dsw-alias-state-error-primary)' } }, t('danger'))),
                    h(
                      'div',
                      { className: 'pl-actions-row' },
                      h(Button, { variant: 'danger', icon: 'trash', onClick: () => setConfirmRemove(true) }, t('remove')),
                      h('span', { className: 'pl-hint' }, t('removeDesc')),
                    ),
                  ),
                )
              : null,
        showCommit && detail
          ? h(CommitModal, {
              t,
              prototype,
              detail,
              onClose: () => setShowCommit(false),
              onDone: () => {
                load(true)
                props.onChanged()
              },
            })
          : null,
        showBranch
          ? h(NewBranchModal, {
              t,
              prototype,
              onClose: () => setShowBranch(false),
              onCreated: (name) => {
                setShowBranch(false)
                notify(fmt(t('switchSuccess'), { name }), 'success')
                load(true)
                props.onChanged()
              },
            })
          : null,
        confirmRemove
          ? h(ConfirmModal, {
              t,
              title: t('removeTitle'),
              desc: t('removeDesc'),
              hint: t('confirmRemoveHint'),
              busy: busy === 'remove',
              onClose: () => setConfirmRemove(false),
              onConfirm: remove,
            })
          : null,
      )
    }

    // ── main panel ──────────────────────────────────────────────────────────

    function PrototypePanel(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => ZH[key] || key
      const [state, setState] = React.useState({ loading: true, data: null, error: '' })
      const [search, setSearch] = React.useState('')
      const [project, setProject] = React.useState('')
      const [modal, setModal] = React.useState(null)
      const [busy, setBusy] = React.useState({})
      const [toast, setToast] = React.useState(null)
      const [previewFrame, setPreviewFrame] = React.useState(0)
      const alive = React.useRef(true)
      const toastTimer = React.useRef(null)
      const loadingRef = React.useRef(false)

      const notify = React.useCallback((message, kind) => {
        if (!message) return
        setToast({ message, kind: kind || 'info' })
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(null), kind === 'error' ? 5200 : 2600)
      }, [])

      const load = React.useCallback(async (silent) => {
        if (loadingRef.current) return
        loadingRef.current = true
        if (!silent) setState((previous) => ({ ...previous, loading: true }))
        try {
          const data = await api('/bootstrap')
          if (!alive.current) return
          setState({ loading: false, data, error: '' })
        } catch (error) {
          if (!alive.current) return
          setState((previous) => ({ loading: false, data: previous.data, error: errorMessage(t, error) }))
        } finally {
          loadingRef.current = false
        }
      }, [t])

      React.useEffect(() => {
        alive.current = true
        load()
        return () => {
          alive.current = false
          if (toastTimer.current) clearTimeout(toastTimer.current)
        }
      }, [load])

      React.useEffect(() => {
        const onOpen = (event) => {
          const id = event && event.detail && event.detail.id
          if (id) setModal({ type: 'detail', id })
        }
        window.addEventListener(EVENT_OPEN, onOpen)
        if (globalThis.__prototypePendingOpenId) {
          const id = globalThis.__prototypePendingOpenId
          delete globalThis.__prototypePendingOpenId
          setModal({ type: 'detail', id })
        }
        return () => window.removeEventListener(EVENT_OPEN, onOpen)
      }, [])

      React.useEffect(() => {
        const timer = setInterval(() => {
          if (!document.hidden) load(true)
        }, 3500)
        return () => clearInterval(timer)
      }, [load])

      const setItemBusy = (id, value) => setBusy((previous) => ({ ...previous, [id]: value }))

      const start = async (id, silent) => {
        setItemBusy(id, 'start')
        try {
          await api(`/prototypes/${id}/start`, { body: {} })
          if (!silent) notify(t('started'), 'success')
          await load(true)
        } catch (error) {
          if (!silent) notify(errorMessage(t, error), 'error')
          throw error
        } finally {
          setItemBusy(id, '')
        }
      }

      const stop = async (id, silent) => {
        setItemBusy(id, 'stop')
        try {
          await api(`/prototypes/${id}/stop`, { body: {} })
          if (!silent) notify(t('stopped'), 'success')
          await load(true)
        } catch (error) {
          if (!silent) notify(errorMessage(t, error), 'error')
          throw error
        } finally {
          setItemBusy(id, '')
        }
      }

      const togglePin = async (id) => {
        const target = prototypes.find((item) => item.id === id)
        const next = !(target && target.pinned)
        setItemBusy(id, 'pin')
        try {
          await api(`/prototypes/${id}`, { method: 'PATCH', body: { pinned: next } })
          notify(fmt(t(next ? 'pinToast' : 'unpinToast'), { name: (target && target.name) || '' }), 'success')
          await load(true)
        } catch (error) {
          notify(errorMessage(t, error), 'error')
        } finally {
          setItemBusy(id, '')
        }
      }

      const switchBranch = async (id, branch) => {
        setItemBusy(id, 'switch')
        try {
          const result = await api(`/prototypes/${id}/git/switch`, { body: { branch } })
          const key = result && result.repaired ? 'switchRepaired' : 'switchSuccess'
          notify(fmt(t(key), { name: branch }), 'success')
          await load(true)
        } catch (error) {
          notify(errorMessage(t, error), 'error')
          await load(true)
        } finally {
          setItemBusy(id, '')
        }
      }

      const data = state.data
      const prototypes = (data && data.prototypes) || []
      const runtimeMap = (data && data.runtime) || {}
      const projects = (data && data.projects) || []
      const query = search.trim().toLowerCase()

      const list = prototypes.filter((prototype) => {
        if (query) {
          const haystack = `${prototype.name || ''} ${prototype.project || ''} ${prototype.dir || ''}`.toLowerCase()
          if (!haystack.includes(query)) return false
        }
        if (project && (prototype.project || t('ungrouped')) !== project) return false
        return true
      })

      const hasFilters = query || project
      const projectOptions = [...new Set([...projects, ...prototypes.map((item) => item.project || t('ungrouped'))])]

      const openPreview = (id) => setModal({ type: 'preview', id })
      const activePreview = modal && modal.type === 'preview' ? prototypes.find((item) => item.id === modal.id) : null
      const activeDetail = modal && modal.type === 'detail' ? prototypes.find((item) => item.id === modal.id) : null

      return h(
        'div',
        { className: 'pl-root' },
        h('style', null, CSS),
        h(
          'div',
          { className: 'pl-inner' },
          h(
            'header',
            { className: 'pl-header' },
            h(
              'div',
              { className: 'pl-heading' },
              h('div', null, h('h1', { className: 'pl-title' }, t('title')), h('p', { className: 'pl-sub' }, t('subtitle'))),
            ),
            h(
              'div',
              { className: 'pl-head-actions' },
              h(Button, { icon: 'refresh', onClick: () => load(), busy: state.loading && !data, title: t('refresh') }, t('refresh')),
              h(Button, { variant: 'primary', icon: 'plus', onClick: () => setModal({ type: 'import' }) }, t('import')),
            ),
          ),
          h(
            'div',
            { className: 'pl-toolbar' },
            h(
              'select',
              { className: 'pl-select', style: { width: 'auto', minWidth: 120, flex: 'none' }, value: project, onChange: (event) => setProject(event.target.value), title: t('project') },
              h('option', { value: '' }, t('allProjects')),
              projectOptions.map((item) => h('option', { key: item, value: item }, item)),
            ),
            h(
              'div',
              { className: 'pl-search' },
              h('span', { className: 'pl-search-icon' }, h(Icon, { name: 'search', size: 14 })),
              h('input', { className: 'pl-input', value: search, placeholder: t('search'), onChange: (event) => setSearch(event.target.value), spellCheck: false }),
              search ? h('button', { type: 'button', className: 'pl-icon-btn pl-search-clear', onClick: () => setSearch(''), title: t('clearFilters') }, h(Icon, { name: 'close', size: 13 })) : null,
            ),
            h('span', { className: 'pl-count' }, hasFilters ? fmt(t('filtered'), { n: list.length }) : fmt(t('count'), { n: prototypes.length })),
          ),
          state.loading && !data
            ? h('div', { className: 'pl-loading' }, h(Spinner), t('loading'))
            : state.error && !data
              ? h('div', { className: 'pl-error' }, h('h3', null, t('errorTitle')), h('p', null, state.error), h(Button, { onClick: () => load() }, t('retry')))
              : prototypes.length === 0
                ? h(EmptyState, { title: t('emptyTitle'), desc: t('emptyDesc'), action: { label: t('emptyAction'), onClick: () => setModal({ type: 'import' }) } })
                : list.length === 0
                  ? h(EmptyState, { title: t('noMatch'), desc: t('noMatchDesc'), action: { label: t('clearFilters'), onClick: () => { setSearch(''); setProject('') } } })
                  : h(
                      'div',
                      { className: 'pl-grid' },
                      list.map((prototype) =>
                        h(PrototypeCard, {
                          key: prototype.id,
                          prototype,
                          runtime: runtimeMap[prototype.id],
                          t,
                          busy: busy[prototype.id],
                          onDetail: (id) => setModal({ type: 'detail', id }),
                          onPreview: openPreview,
                          onStart: start,
                          onStop: stop,
                          onSwitch: switchBranch,
                          onTogglePin: togglePin,
                        }),
                      ),
                    ),
          state.error && data ? h('div', { className: 'pl-hint', style: { marginTop: 12, color: 'var(--dsw-alias-state-error-primary)' } }, state.error) : null,
        ),
        modal && modal.type === 'import'
          ? h(ImportModal, {
              t,
              projects,
              onClose: () => setModal(null),
              onImported: (created) => {
                setModal({ type: 'detail', id: created.id })
                notify(t('importSuccess'), 'success')
                load(true)
              },
            })
          : null,
        modal && modal.type === 'detail' && activeDetail
          ? h(DetailModal, {
              t,
              prototypeId: modal.id,
              notify,
              onClose: () => setModal(null),
              onChanged: () => load(true),
              onPreview: () => setModal({ type: 'preview', id: modal.id }),
            })
          : null,
        modal && modal.type === 'preview' && activePreview
          ? h(PreviewModal, {
              t,
              prototype: activePreview,
              runtime: runtimeMap[activePreview.id],
              frameKey: previewFrame,
              onReload: () => setPreviewFrame((value) => value + 1),
              onStart: () => start(activePreview.id, true),
              onStop: () => stop(activePreview.id, true).catch(() => {}),
              onRestart: async () => {
                await stop(activePreview.id, true)
                await start(activePreview.id, true)
              },
              onClose: () => setModal(null),
            })
          : null,
        h(Toast, { toast }),
      )
    }

    // ── @ reference source ──────────────────────────────────────────────────

    let pendingOpenId = ''

    function encodeRef(value) {
      return 'pl:' + encodeURIComponent(JSON.stringify({ id: value.id, name: value.name }))
    }

    function decodeRef(ref) {
      const raw = String(ref || '').replace(/^pl:/, '')
      try {
        const value = JSON.parse(decodeURIComponent(raw))
        return value && typeof value.id === 'string' ? value : null
      } catch {
        return null
      }
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'prototype-library: dictionaries')
        const t = ctx.locale.bind(NS)
        const Panel = (props) => h(PrototypePanel, { ...props, t: props.t || t })

        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, Panel))
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 5, label: () => t('panel'), locale: NS }, PanelIcon),
        )

        const focusPanel = () => {
          try {
            const layout = ctx.layout || (typeof ctx.get === 'function' ? ctx.get('layout') : null)
            if (layout && typeof layout.selectPanel === 'function') layout.selectPanel(PANEL_ID)
          } catch {
            /* best effort */
          }
        }

        let cache = { at: 0, items: [] }
        const loadItems = async (signal) => {
          if (Date.now() - cache.at < 2000 && cache.items.length > 0) return cache.items
          const response = await fetch(API + '/bootstrap', { cache: 'no-store', signal })
          if (!response.ok) return cache.items
          const data = await response.json()
          cache = { at: Date.now(), items: Array.isArray(data.prototypes) ? data.prototypes : [] }
          return cache.items
        }

        const source = {
          trigger: '@',
          name: 'prototype-library',
          showGroupTitle: false,
          async candidates(session, request) {
            let items = []
            try {
              items = await loadItems(request.signal)
            } catch {
              items = []
            }
            const query = String(request.query || '').trim().toLowerCase()
            const filtered = query
              ? items.filter((item) => `${item.name || ''} ${item.project || ''} ${item.dir || ''}`.toLowerCase().includes(query))
              : items
            return filtered.slice(0, 20).map((item) => ({
              name: item.name || item.dir || 'prototype',
              description: `${item.project || t('ungrouped')} · ${kindLabel(item.kind)}`,
              icon: 'folder',
              section: t('atSection'),
              value: JSON.stringify({ id: item.id, name: item.name }),
            }))
          },
          onPick(pick) {
            let value = null
            try {
              value = JSON.parse((pick.candidate && pick.candidate.value) || '{}')
            } catch {
              value = null
            }
            if (!value || !value.id) return { close: true }
            const label = value.name || (pick.candidate && pick.candidate.name) || 'prototype'
            return {
              insert: {
                source: 'prototype-library',
                ref: encodeRef({ id: value.id, name: label }),
                label,
                appearance: 'file',
                clipboardText: label,
              },
            }
          },
          codec: {
            clipboardText(ref) {
              const value = decodeRef(ref)
              return value && value.name ? value.name : ref
            },
            async serialize(ref) {
              const value = decodeRef(ref)
              if (!value) return ref
              let detail = null
              try {
                const response = await fetch(`${API}/prototypes/${encodeURIComponent(value.id)}`, { cache: 'no-store' })
                if (response.ok) detail = await response.json()
              } catch {
                detail = null
              }
              if (!detail || !detail.prototype) {
                const cached = cache.items.find((item) => item.id === value.id)
                return `原型：${value.name}${cached && cached.dir ? `\n目录：${cached.dir}` : ''}`
              }
              const prototype = detail.prototype
              const git = detail.git || {}
              const lines = [
                `原型：${prototype.name}`,
                `项目：${prototype.project || t('ungrouped')}`,
                `目录：${prototype.dir}`,
                `类型：${kindLabel(prototype.kind)}`,
              ]
              if (git.hasGit) {
                lines.push(`分支：${git.branch || 'detached HEAD'}`)
                if (git.changedCount) lines.push(`工作区：有 ${git.changedCount} 个未提交改动`)
              }
              if (prototype.repoUrl || git.remoteUrl) lines.push(`仓库：${prototype.repoUrl || git.remoteUrl}`)
              return lines.join('\n')
            },
          },
          openReference(session, reference) {
            const value = decodeRef(reference && reference.ref)
            if (!value) return false
            pendingOpenId = value.id
            globalThis.__prototypePendingOpenId = value.id
            focusPanel()
            try {
              window.dispatchEvent(new CustomEvent(EVENT_OPEN, { detail: { id: value.id } }))
            } catch {
              /* ignore */
            }
            return true
          },
        }

        const registerSource = (triggers) => {
          if (!triggers || typeof triggers.registerSource !== 'function') return
          try {
            if (globalThis.__prototypeTriggerDispose) globalThis.__prototypeTriggerDispose()
          } catch {
            /* ignore */
          }
          globalThis.__prototypeTriggerDispose = null
          ctx.effect(() => {
            const dispose = triggers.registerSource(source)
            globalThis.__prototypeTriggerDispose = dispose
            return () => {
              if (globalThis.__prototypeTriggerDispose === dispose) globalThis.__prototypeTriggerDispose = null
              try {
                dispose()
              } catch {
                /* ignore */
              }
            }
          }, 'prototype-library: @ source')
        }

        if (typeof ctx.inject === 'function') {
          ctx.inject(['inputTriggers'], (triggerCtx) => {
            const triggers = triggerCtx.inputTriggers || (typeof triggerCtx.get === 'function' ? triggerCtx.get('inputTriggers') : null)
            registerSource(triggers)
          })
        } else {
          registerSource(typeof ctx.get === 'function' ? ctx.get('inputTriggers') : ctx.inputTriggers)
        }
        void pendingOpenId
      },
    }
  },
})
