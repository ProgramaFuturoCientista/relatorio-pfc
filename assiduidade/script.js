/* ============================================================
 * PFC — Relatórios (site estático)
 * script.js — DataTables + Edição de Contra-medidas + Badges Auditoria
 * ============================================================
 * Requisitos:
 * - jQuery 3.7+
 * - DataTables 1.13+ (core + buttons)
 * ------------------------------------------------------------
 */

/* ---------- Utilitário: inicializar DataTables com filtros por coluna ---------- */
function initDT(id) {
  const $el = $('#' + id);
  if (!$el.length) return;

  // Evita reinit + limpa filtros antigos
  if ($.fn.dataTable.isDataTable($el)) {
    $el.DataTable().destroy();
    $el.find('thead input').remove();
  }

  // Cria inputs de filtro ANTES de inicializar
  const $ths = $el.find('thead th');
  $ths.each(function () {
    const title = $(this).text();
    $(this).html(
      title + '<br><input type="text" style="width:100%;box-sizing:border-box;" placeholder="filtrar ' + title + '" />'
    );
  });

  // Inicializa DataTable
  const table = $el.DataTable({
    dom: 'Bfrtip',
    buttons: ['copy', 'csv', 'excel', 'print'],
    pageLength: 25,
    order: []
  });

  // Liga filtros por coluna
  table.columns().every(function () {
    const that = this;
    $('input', this.header()).on('keyup change clear', function () {
      if (that.search() !== this.value) {
        that.search(this.value).draw();
      }
    });
  });

  // ---- Enhancements específicos por tabela ----
  if (id === 'tabIncons') enhanceAuditoriaBadges(table, id);
}

/* ---------- Auditoria: badges visuais para status/última/motivo ---------- */
function enhanceAuditoriaBadges(table, tableId) {
  function badge($cell, type) {
    const vRaw = $cell.text() || '';
    const v = vRaw.toLowerCase().trim();
    if (!v) return;

    if (type === 'status') {
      if (v.includes('deslig')) $cell.html('<span class="badge b-red">Desligado</span>');
      else $cell.html('<span class="badge b-green">Ativo</span>');
    } else if (type === 'ultima') {
      if (v === 'presente') $cell.html('<span class="badge b-green nowrap">Presente (última)</span>');
      else if (v === 'falta') $cell.html('<span class="badge b-yellow nowrap">Falta (última)</span>');
      else if (v.includes('deslig')) $cell.html('<span class="badge b-red nowrap">Desligado (última)</span>');
      else $cell.html('<span class="badge b-gray nowrap">' + vRaw + '</span>');
    } else if (type === 'motivo') {
      if (v.includes('cadastro_desligado') || v.includes('ativo_mas_ultima')) {
        $cell.html('<span class="badge b-yellow">' + vRaw + '</span>');
      }
    }
  }

  // Descobre índices das colunas pelo cabeçalho
  const idx_status = $('#' + tableId + ' thead th')
    .filter(function () { return $(this).text().toLowerCase().includes('status_cadastro'); })
    .index();
  const idx_ult = $('#' + tableId + ' thead th')
    .filter(function () { return $(this).text().toLowerCase().includes('ultima_marcacao_chamada'); })
    .index();
  const idx_motivo = $('#' + tableId + ' thead th')
    .filter(function () { return $(this).text().toLowerCase().includes('motivo_inconsistencia'); })
    .index();

  table.on('draw', function () {
    $('#' + tableId + ' tbody tr').each(function () {
      const $tds = $(this).find('td');
      if (idx_status >= 0) badge($($tds[idx_status]), 'status');
      if (idx_ult >= 0) badge($($tds[idx_ult]), 'ultima');
      if (idx_motivo >= 0) badge($($tds[idx_motivo]), 'motivo');
    });
  }).trigger('draw');
}

/* ---------- Passo 2: tornar "Contra-medidas de Evasão" editável em evasaoTurma ---------- */
async function setupContraMedidas() {
  const tableId = 'evasaoTurma';
  const $t = $('#' + tableId);
  if (!$t.length) return; // só executa na página com a tabela de evasão por turma

  // Descobre índices das colunas pelo cabeçalho
  const ths = Array.from($t.find('thead th')).map(th => th.textContent.trim().toLowerCase());
  const turmaIdx = ths.indexOf('turma');
  const contraIdx = ths.indexOf('contra-medidas de evasão');

  if (turmaIdx === -1 || contraIdx === -1) return; // segurança, coluna não disponível

  // Carrega JSON versionado (se existir)
  let contras = {};
  try {
    const r = await fetch('contramedidas.json', { cache: 'no-store' });
    if (r.ok) contras = await r.json();
  } catch (e) {
    // ok se não existir; ficará vazio e será criado no download
  }

  // Autosave por pasta/relatório
  const STORAGE_KEY = 'pfc_contramedidas_' + location.pathname;
  let drafts = {};
  try {
    drafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    drafts = {};
  }

  // Converte as células da coluna em <textarea>, com pré-preenchimento
  $t.find('tbody tr').each(function () {
    const $cells = $(this).find('td');
    const turma = ($cells.eq(turmaIdx).text() || '').trim();
    const key = turma; // chave = nome exato da turma

    const valor = (drafts[key] != null ? drafts[key] : (contras[key] != null ? contras[key] : ''));

    const $cell = $cells.eq(contraIdx).empty();
    const $ta = $('<textarea rows="3" style="width:100%;resize:vertical;" />').val(valor);

    // autosave por linha
    $ta.on('input', () => {
      drafts[key] = $ta.val();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    });

    $cell.append($ta);
  });

  // Toolbar de exportação (download/cópia)
  const $toolbar = $(`
    <div id="toolbarContramedidas" style="margin:10px 0; display:flex; gap:8px; flex-wrap:wrap;">
      <button id="btnExportJSON">Baixar JSON das Contra-medidas</button>
      <button id="btnCopyJSON">Copiar JSON p/ Área de Transferência</button>
      <small style="opacity:.7">Os rascunhos ficam salvos neste navegador até você commitar o JSON.</small>
    </div>
  `);

  // Insere a barra logo após o título da seção
  const $titulo = $('#tabela_evasao_turma h2');
  if ($titulo.length) $titulo.after($toolbar); else $t.before($toolbar);

  function buildJSON() {
    // Mescla: rascunhos sobrescrevem o JSON versionado
    return JSON.stringify({ ...contras, ...drafts }, null, 2);
  }

  $('#btnExportJSON').on('click', () => {
    const blob = new Blob([buildJSON()], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'contramedidas.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  $('#btnCopyJSON').on('click', async () => {
    try {
      await navigator.clipboard.writeText(buildJSON());
      alert('JSON copiado!');
    } catch (e) {
      alert('Não foi possível copiar automaticamente. Use o botão de download.');
    }
  });
}

/* ---------- Bootstrap: roda quando o DOM está pronto ---------- */
$(document).ready(function () {
  // Inicializa DataTables onde existir
  [
    // index.html
    'evasaoTurma', 'evasaoCidade', 'evasaoSupervisor', 'topAlunos',
    // assiduidade
    'resumoGeral', 'assidCidade', 'assidTurma', 'topAssiduos',
    // análises
    'topRisco',
    // auditoria
    'tabIncons', 'tabTipo', 'tabCidade', 'tabTurma', 'tabSemCadastro', 'tabSemChamada'
  ].forEach(initDT);

  // Ativa a camada de edição da coluna "Contra-medidas de Evasão"
  setupContraMedidas();
});


// === 1) Tornar a coluna "Contra-medidas de Evasão" larga e editável (textarea) ===
(function () {
  const $t = $('#evasaoTurma');
  if (!$t.length) return;

  // Descobre o índice da coluna pela legenda do TH
  const idxContra = $t.find('thead th')
    .toArray()
    .findIndex(th => th.textContent.trim().toLowerCase().startsWith('contra-medidas'));

  if (idxContra < 0) return;

  // Função para trocar conteúdo por <textarea> mantendo o texto
  const ensureTextarea = (td) => {
    const $td = $(td);
    $td.addClass('cm-evasao-cell');

    // já tem textarea?
    if ($td.find('textarea.cm-evasao-textarea').length) return;

    const currentText = $td.text().trim();
    // limpa o TD e injeta textarea
    const $ta = $('<textarea class="cm-evasao-textarea" spellcheck="false"></textarea>');
    $ta.val(currentText);
    $td.empty().append($ta);

    // auto-height na digitação
    const autoGrow = (el) => {
      el.style.height = 'auto';
      el.style.height = (el.scrollHeight + 6) + 'px';
    };
    $ta.on('input', function () { autoGrow(this); });
    // auto-ajuste inicial
    autoGrow($ta.get(0));
  };

  // Aplica nas linhas existentes
  $t.find(`tbody tr`).each(function () {
    const td = $(this).children().get(idxContra);
    if (td) ensureTextarea(td);
  });

  // Se DataTables re-renderizar, aplicar de novo
  $t.on('draw.dt', function () {
    $t.find(`tbody tr`).each(function () {
      const td = $(this).children().get(idxContra);
      if (td) ensureTextarea(td);
    });
  });
})();

// === 2) Botão Exportar -> PDF (Imprimir) ===
(function () {
  const btn = document.getElementById('btnExportar');
  if (!btn) return;

  // Expandir todas as textareas antes de imprimir
  const expandAllTextareas = () => {
    document.querySelectorAll('.cm-evasao-textarea').forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = (ta.scrollHeight + 6) + 'px';
    });
  };

  window.addEventListener('beforeprint', expandAllTextareas);
  btn.addEventListener('click', () => {
    expandAllTextareas();
    window.print(); // Usuário escolhe "Salvar como PDF"
  });
})();
