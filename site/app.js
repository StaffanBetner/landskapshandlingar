(() => {
  'use strict';

  const DATA_URL = 'data/landskapshandlingar.json';
  const IMAGE_BASE = 'https://sok.riksarkivet.se/bildvisning/';
  const WRAP_COLUMNS = ['Område', 'Anmärkningar'];
  const MAX_SELECT_OPTIONS = 20; // kolumner med få unika värden får rullgardin (som faktorer i DT)

  const $id = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  setupNavigation();

  fetch(DATA_URL)
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(init)
    .catch((err) => { $id('loader').textContent = `Kunde inte ladda registret (${err.message}).`; });

  function init(data) {
    const { columns: names, rows } = data;
    const isFlag = names.map((_, i) => rows.every((r) => typeof r[i] === 'boolean'));

    if (data.updated) $id('updated').textContent = `Data senast uppdaterad ${data.updated}.`;
    if (data.source) $id('source-link').href = data.source;

    // Två rubrikrader: titlar + filter (motsvarar filter = 'top' i DT)
    const filterKinds = names.map((name, i) => {
      if (isFlag[i]) return { type: 'select', options: ['JA'] };
      if (name === 'År') return { type: 'year' };
      const uniq = [...new Set(rows.map((r) => r[i]).filter((v) => v != null))];
      if (uniq.length <= MAX_SELECT_OPTIONS) {
        return { type: 'select', options: uniq.sort((a, b) => String(a).localeCompare(String(b), 'sv', { numeric: true })) };
      }
      return { type: 'text' };
    });

    const table = $id('register');
    table.innerHTML = `<thead>
      <tr class="titles">${names.map((n) => `<th>${esc(n)}</th>`).join('')}</tr>
      <tr class="filters">${filterKinds.map((f, i) => `<th data-dt-order="disable">${filterControl(f, i)}</th>`).join('')}</tr>
    </thead>`;

    const columns = names.map((name, i) => {
      const col = { data: i, defaultContent: '' };
      if (isFlag[i]) {
        col.render = (d) => (d ? 'JA' : '');
      } else if (name === 'Bildlänk') {
        col.render = (d, t) => {
          if (!d) return '';
          if (t === 'display') return `<a href="${IMAGE_BASE}${encodeURIComponent(d)}" target="_blank" rel="noopener">Länk</a>`;
          return t === 'export' ? IMAGE_BASE + d : d;
        };
      } else {
        col.render = (d, t) => (d == null ? '' : t === 'display' ? esc(d) : d);
      }
      if (WRAP_COLUMNS.includes(name)) col.className = 'wrap';
      else col.className = 'nowrap';
      return col;
    });

    const exportOpts = { orthogonal: 'export' };
    const dt = new DataTable(table, {
      data: rows,
      columns,
      deferRender: true,
      autoWidth: false,
      pageLength: 100,
      lengthMenu: [25, 50, 100, 250, 500, 1000],
      language: { url: 'https://cdn.datatables.net/plug-ins/2.1.8/i18n/sv-SE.json' },
      layout: {
        topStart: ['pageLength', { buttons: [
          { extend: 'excelHtml5', text: 'Excel', title: 'Landskapshandlingar', exportOptions: exportOpts },
          { extend: 'csvHtml5', text: 'CSV', title: 'Landskapshandlingar', exportOptions: exportOpts },
        ] }],
        topEnd: 'search',
        bottomStart: 'info',
        bottomEnd: 'paging',
      },
      initComplete() {
        $id('loader').remove();
        bindFilters(this.api(), filterKinds);
        const h = table.querySelector('thead tr.titles').getBoundingClientRect().height;
        table.style.setProperty('--title-row-h', `${h}px`);
      },
    });
    return dt;
  }

  function filterControl(f, i) {
    const id = `filter-${i}`;
    if (f.type === 'select') {
      const opts = f.options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
      return `<select id="${id}" data-col="${i}" aria-label="Filter"><option value="">Alla</option>${opts}<option value="__empty__">(tom)</option></select>`;
    }
    const ph = f.type === 'year' ? 't.ex. 1600-1610' : 'Alla';
    return `<input type="search" id="${id}" data-col="${i}" placeholder="${ph}" aria-label="Filter" autocomplete="off">`;
  }

  function bindFilters(api, filterKinds) {
    const head = api.table().header();
    head.querySelectorAll('tr.filters input, tr.filters select').forEach((el) => {
      const col = api.column(Number(el.dataset.col));
      const kind = filterKinds[el.dataset.col].type;
      let timer;
      ['click', 'keydown'].forEach((ev) => el.addEventListener(ev, (e) => e.stopPropagation()));

      if (kind === 'select') {
        el.addEventListener('change', () => {
          const v = el.value;
          if (v === '') col.search('');
          else if (v === '__empty__') col.search('^$', true, false);
          else col.search(`^${DataTable.util.escapeRegex(v)}$`, true, false);
          api.draw();
        });
      } else if (kind === 'year') {
        el.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            const range = parseYearRange(el.value);
            col.search(range ? (d) => { const y = Number(d); return y >= range[0] && y <= range[1]; } : '');
            api.draw();
          }, 200);
        });
      } else {
        el.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => col.search(el.value).draw(), 200);
        });
      }
    });
  }

  // "1600", "1600-1610", "1600-", "-1610"
  function parseYearRange(s) {
    const m = s.replace(/\s/g, '').match(/^(\d{0,4})(?:([-–])(\d{0,4}))?$/);
    if (!m || (!m[1] && !m[3])) return null;
    if ((m[1] && m[1].length < 4) || (m[3] && m[3].length < 4)) return null; // halvskrivet årtal
    const from = m[1] ? Number(m[1]) : -Infinity;
    const to = m[2] ? (m[3] ? Number(m[3]) : Infinity) : from;
    return [from, to];
  }

  function setupNavigation() {
    const show = () => {
      const tab = location.hash === '#om' ? 'om' : 'register';
      document.querySelectorAll('.tab').forEach((s) => { s.hidden = s.id !== `tab-${tab}`; });
      document.querySelectorAll('.sidebar-menu a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
      document.body.classList.remove('sidebar-open');
    };
    window.addEventListener('hashchange', show);
    show();

    $id('sidebar-toggle').addEventListener('click', () => {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      document.body.classList.toggle(mobile ? 'sidebar-open' : 'sidebar-collapse');
    });
  }
})();
