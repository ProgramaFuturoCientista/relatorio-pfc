/* Sistema de Relatórios PFC - JavaScript */
/* Versão: 2.7.0 */

// Inicializar DataTables
function initDT(id) {
    // Verificar se a tabela já foi inicializada
    if ($.fn.DataTable.isDataTable('#' + id)) {
        $('#' + id).DataTable().destroy();
    }
    
    // Configurações específicas para cada tabela
    var config = {
        "language": {
            "url": "https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json"
        },
        "pageLength": 6,  // Reduzido para 6 linhas por página
        "lengthMenu": [6, 10, 15, 25],  // Opções menores
        "order": [[0, "asc"]],
        "columnDefs": [
            { "orderable": false, "targets": -1 }
        ],
        "dom": 'Bfrtip',
        "buttons": [
            'copy', 'csv', 'excel', 'print'
        ],
        "responsive": false,
        "scrollX": false
    };
    
    // Configurações específicas para tabelas de evasão (similar à assiduidade)
    if (id === 'evasaoTurma' || id === 'evasaoCidade' || id === 'evasaoSupervisor') {
        config.columnDefs = [
            { "orderable": false, "targets": -1 }
        ];
        // Reativar scroll horizontal para tabelas de evasão
        config.scrollX = true;
        config.responsive = true;
    }
    
    $('#' + id).DataTable(config);
    
    // Aplicar cores condicionais após inicializar a tabela
    setTimeout(function() {
        aplicarCoresCondicionais(id);
    }, 100);
    
    // Reaplicar cores quando a página mudar
    $('#' + id).on('draw.dt', function() {
        aplicarCoresCondicionais(id);
    });
}

// Função para aplicar cores condicionais nas tabelas
function aplicarCoresCondicionais(tableId) {
    var selector = tableId ? '#' + tableId + ' tbody tr' : '.data-table tbody tr';
    
    $(selector).each(function() {
        var $row = $(this);
        
        // Aplicar cores baseado no tipo de tabela
        if (tableId === 'evasaoTurma') {
            // Tabela de turma tem 11 colunas
            aplicarCoresTurma($row);
        } else if (tableId === 'evasaoCidade' || tableId === 'evasaoSupervisor') {
            // Tabelas de cidade e supervisor têm 7 colunas
            aplicarCoresCidadeSupervisor($row);
        }
    });
}

// Função específica para tabela de turma (12 colunas agora)
function aplicarCoresTurma($row) {
    // Vagas Disponíveis (coluna 7 - índice 6)
    var vagasTexto = $row.find('td:eq(6)').text().trim();
    var vagas = parseFloat(vagasTexto);
    
    if (!isNaN(vagas)) {
        var $cell = $row.find('td:eq(6)');
        $cell.removeClass('badge-excelente badge-bom badge-regular badge-ruim badge-critico badge-piscante');
        
        if (vagas >= 3 && vagas <= 4) {
            $cell.addClass('badge-amarelo');
        } else if (vagas > 4 && vagas <= 6) {
            $cell.addClass('badge-ruim');
        } else if (vagas > 6) {
            $cell.addClass('badge-piscante');
        }
    }
    
    // Média de Faltas (coluna 12 - índice 11)
    var faltasTexto = $row.find('td:eq(11)').text().trim();
    var faltas = parseFloat(faltasTexto);
    
    if (!isNaN(faltas)) {
        var $cell = $row.find('td:eq(11)');
        $cell.removeClass('badge-excelente badge-bom badge-regular badge-ruim badge-critico badge-piscante');
        
        if (faltas >= 3 && faltas <= 4) {
            $cell.addClass('badge-amarelo');
        } else if (faltas > 4 && faltas <= 6) {
            $cell.addClass('badge-ruim');
        } else if (faltas > 6) {
            $cell.addClass('badge-piscante');
        }
    }
    
    // Desvio Padrão (coluna 11 - índice 10)
    var desvioTexto = $row.find('td:eq(10)').text().trim();
    var desvio = parseFloat(desvioTexto);
    
    if (!isNaN(desvio)) {
        var $cell = $row.find('td:eq(10)');
        $cell.removeClass('badge-excelente badge-bom badge-regular badge-ruim badge-critico');
        
        if (desvio <= 0.1) {
            $cell.addClass('badge-excelente');
        } else if (desvio <= 0.2) {
            $cell.addClass('badge-bom');
        } else if (desvio <= 0.3) {
            $cell.addClass('badge-regular');
        } else if (desvio <= 0.5) {
            $cell.addClass('badge-ruim');
        } else {
            $cell.addClass('badge-critico');
        }
    }
    
    // % Evasão (coluna 8 - índice 7)
    var evasaoTexto = $row.find('td:eq(7)').text().trim().replace('%', '');
    var evasao = parseFloat(evasaoTexto);
    
    if (!isNaN(evasao)) {
        var $cell = $row.find('td:eq(7)');
        $cell.removeClass('badge-excelente badge-bom badge-regular badge-ruim badge-critico');
        
        if (evasao == 0) {
            $cell.addClass('badge-excelente');
        } else if (evasao <= 10) {
            $cell.addClass('badge-bom');
        } else if (evasao <= 25) {
            $cell.addClass('badge-regular');
        } else if (evasao <= 50) {
            $cell.addClass('badge-ruim');
        } else {
            $cell.addClass('badge-critico');
        }
    }
    
    // Prob. Desligamento (coluna 9 - índice 8)
    var probTexto = $row.find('td:eq(8)').text().trim().replace('%', '');
    var prob = parseFloat(probTexto);
    
    if (!isNaN(prob)) {
        var $cell = $row.find('td:eq(8)');
        $cell.removeClass('badge-excelente badge-bom badge-regular badge-ruim badge-critico');
        
        if (prob <= 5) {
            $cell.addClass('badge-excelente');
        } else if (prob <= 15) {
            $cell.addClass('badge-bom');
        } else if (prob <= 30) {
            $cell.addClass('badge-regular');
        } else if (prob <= 50) {
            $cell.addClass('badge-ruim');
        } else {
            $cell.addClass('badge-critico');
        }
    }
}

// Função específica para tabelas de cidade e supervisor (7 colunas)
function aplicarCoresCidadeSupervisor($row) {
    // % Evasão (coluna 6 - índice 5)
    var evasaoTexto = $row.find('td:eq(5)').text().trim().replace('%', '');
    var evasao = parseFloat(evasaoTexto);
    
    if (!isNaN(evasao)) {
        var $cell = $row.find('td:eq(5)');
        $cell.removeClass('badge-excelente badge-bom badge-regular badge-ruim badge-critico');
        
        if (evasao == 0) {
            $cell.addClass('badge-excelente');
        } else if (evasao <= 10) {
            $cell.addClass('badge-bom');
        } else if (evasao <= 25) {
            $cell.addClass('badge-regular');
        } else if (evasao <= 50) {
            $cell.addClass('badge-ruim');
        } else {
            $cell.addClass('badge-critico');
        }
    }
    
    // Prob. Desligamento (coluna 7 - índice 6)
    var probTexto = $row.find('td:eq(6)').text().trim().replace('%', '');
    var prob = parseFloat(probTexto);
    
    if (!isNaN(prob)) {
        var $cell = $row.find('td:eq(6)');
        $cell.removeClass('badge-excelente badge-bom badge-regular badge-ruim badge-critico');
        
        if (prob <= 5) {
            $cell.addClass('badge-excelente');
        } else if (prob <= 15) {
            $cell.addClass('badge-bom');
        } else if (prob <= 30) {
            $cell.addClass('badge-regular');
        } else if (prob <= 50) {
            $cell.addClass('badge-ruim');
        } else {
            $cell.addClass('badge-critico');
        }
    }
}

// Melhorar badges na auditoria
function enhanceAuditoriaBadges(table, tableId) {
    $(document).ready(function() {
        $('#' + tableId + ' tbody tr').each(function() {
            var $row = $(this);
            
            // Status
            var statusCell = $row.find('td:eq(2)');
            var status = statusCell.text().trim();
            if (status === 'Ativo') {
                statusCell.html('<span class="badge badge-ativo">Ativo</span>');
            } else if (status === 'Desligado') {
                statusCell.html('<span class="badge badge-desligado">Desligado</span>');
            }
            
            // Última marca
            var ultimaMarcaCell = $row.find('td:eq(3)');
            var ultimaMarca = ultimaMarcaCell.text().trim();
            if (ultimaMarca === 'Presente') {
                ultimaMarcaCell.html('<span class="badge badge-ok">Presente</span>');
            } else if (ultimaMarca === 'Falta') {
                ultimaMarcaCell.html('<span class="badge badge-inconsistente">Falta</span>');
            }
            
            // Motivo da inconsistência
            var motivoCell = $row.find('td:eq(4)');
            var motivo = motivoCell.text().trim();
            if (motivo && motivo !== '-') {
                motivoCell.html('<span class="badge badge-inconsistente">' + motivo + '</span>');
            }
        });
    });
}

// Configurar contra-medidas
function setupContraMedidas() {
    $(document).ready(function() {
        // Tornar coluna de contra-medidas editável
        $('#evasaoTurma tbody tr').each(function() {
            var $row = $(this);
            var contraMedidasCell = $row.find('td:eq(5)');
            var contraMedidas = contraMedidasCell.text().trim();
            
            var textarea = $('<textarea class="contra-medidas" placeholder="Digite as contra-medidas...">' + contraMedidas + '</textarea>');
            contraMedidasCell.html(textarea);
        });
        
        // Auto-resize textareas
        $('.contra-medidas').on('input', function() {
            autoGrow(this);
        });
        
        // Salvar contra-medidas no localStorage
        $('.contra-medidas').on('blur', function() {
            var contraMedidas = {};
            $('#evasaoTurma tbody tr').each(function(index) {
                var turma = $(this).find('td:eq(0)').text().trim();
                var contraMedida = $(this).find('.contra-medidas').val();
                contraMedidas[turma] = contraMedida;
            });
            localStorage.setItem('contraMedidasPFC', JSON.stringify(contraMedidas));
        });
        
        // Carregar contra-medidas salvas
        var savedContraMedidas = localStorage.getItem('contraMedidasPFC');
        if (savedContraMedidas) {
            var contraMedidas = JSON.parse(savedContraMedidas);
            $('#evasaoTurma tbody tr').each(function() {
                var turma = $(this).find('td:eq(0)').text().trim();
                if (contraMedidas[turma]) {
                    $(this).find('.contra-medidas').val(contraMedidas[turma]);
                }
            });
        }
        
        // Botão para baixar contra-medidas
        var downloadBtn = $('<button class="dt-button" style="margin-left: 10px;">Baixar Contra-medidas</button>');
        $('.dt-buttons').append(downloadBtn);
        
        downloadBtn.on('click', function() {
            var contraMedidas = {};
            $('#evasaoTurma tbody tr').each(function() {
                var turma = $(this).find('td:eq(0)').text().trim();
                var contraMedida = $(this).find('.contra-medidas').val();
                contraMedidas[turma] = contraMedida;
            });
            
            var dataStr = JSON.stringify(contraMedidas, null, 2);
            var dataBlob = new Blob([dataStr], {type: 'application/json'});
            var url = URL.createObjectURL(dataBlob);
            var link = document.createElement('a');
            link.href = url;
            link.download = 'contra-medidas-pfc.json';
            link.click();
            URL.revokeObjectURL(url);
        });
        
        // Botão para copiar contra-medidas
        var copyBtn = $('<button class="dt-button" style="margin-left: 10px;">Copiar Contra-medidas</button>');
        $('.dt-buttons').append(copyBtn);
        
        copyBtn.on('click', function() {
            var contraMedidas = {};
            $('#evasaoTurma tbody tr').each(function() {
                var turma = $(this).find('td:eq(0)').text().trim();
                var contraMedida = $(this).find('.contra-medidas').val();
                contraMedidas[turma] = contraMedida;
            });
            
            var dataStr = JSON.stringify(contraMedidas, null, 2);
            navigator.clipboard.writeText(dataStr).then(function() {
                alert('Contra-medidas copiadas para a área de transferência!');
            });
        });
    });
}

// Auto-resize textarea
function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
}

// Inicializar todas as funcionalidades
$(document).ready(function() {
    // Inicializar DataTables
    initDT('evasaoTurma');
    initDT('evasaoCidade');
    initDT('evasaoSupervisor');
    
    // Configurar contra-medidas
    setupContraMedidas();
    
    // Botão de exportar
    $('.export-btn').on('click', function() {
        window.print();
    });
    
    // Melhorar aparência das tabelas
    $('.data-table').addClass('table-striped table-hover');
    
    // Adicionar tooltips
    $('[title]').tooltip();
    
    // Animar cards
    $('.card').each(function(index) {
        $(this).css('animation-delay', (index * 0.1) + 's');
    });
});

// Função para exportar dados
function exportarDados(tabelaId, formato) {
    var table = $('#' + tabelaId).DataTable();
    
    switch(formato) {
        case 'excel':
            table.button('.buttons-excel').trigger();
            break;
        case 'csv':
            table.button('.buttons-csv').trigger();
            break;
        case 'copy':
            table.button('.buttons-copy').trigger();
            break;
        case 'print':
            table.button('.buttons-print').trigger();
            break;
    }
}

// Função para filtrar dados
function filtrarDados(tabelaId, coluna, valor) {
    var table = $('#' + tabelaId).DataTable();
    table.column(coluna).search(valor).draw();
}

// Função para limpar filtros
function limparFiltros(tabelaId) {
    var table = $('#' + tabelaId).DataTable();
    table.search('').columns().search('').draw();
}

// Função para atualizar página
function atualizarPagina() {
    location.reload();
}

// Função para mostrar/ocultar seções
function toggleSecao(secaoId) {
    $('#' + secaoId).slideToggle();
}

// Função para destacar linhas
function destacarLinhas(tabelaId, condicao) {
    var table = $('#' + tabelaId).DataTable();
    table.rows().every(function() {
        var data = this.data();
        if (condicao(data)) {
            $(this.node()).addClass('highlighted');
        } else {
            $(this.node()).removeClass('highlighted');
        }
    });
}

// CSS para linhas destacadas
$('<style>')
    .prop('type', 'text/css')
    .html('.highlighted { background-color: #fff3cd !important; }')
    .appendTo('head');
