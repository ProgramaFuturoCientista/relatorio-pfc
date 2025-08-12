// =============================
// SCRIPT.JS - Relatórios PFC
// =============================

// Inicializa DataTables em todas as tabelas com classe .tabela-interativa
$(document).ready(function () {
    $('.tabela-interativa').DataTable({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json'
        },
        pageLength: 10,
        responsive: true
    });
});
