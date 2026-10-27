/**
 * ESTRUTURA CORPORATIVA E CARGOS (CONTEXTO POR SETOR)
 */
const SECTORS = ["TI", "Enfermagem", "UTI", "Centro Cirúrgico", "Farmácia", "Laboratório", "Radiologia", "Recepção", "CCIH", "Nutrição", "Manutenção"];
const TYPES = { text: "Texto curto", textarea: "Texto longo", number: "Número", date: "Data", time: "Hora", select: "Lista de opções", check: "Sim/Não", sign: "Assinatura", section: "Título de seção", list: "Lista com marcadores", table: "Tabela dinâmica" };

const ROLES_CONTEXT = {
    "TI": [ {r: "Gestor(a) de TI", m: true}, {r: "Analista de Sistemas", m: true}, {r: "Suporte Técnico", m: false} ],
    "Enfermagem": [ {r: "Enfermeiro(a) Coordenador(a)", m: true}, {r: "Enfermeiro(a) Assistencial", m: false}, {r: "Técnico(a) de Enfermagem", m: false} ],
    "Farmácia": [ {r: "Farmacêutico(a) RT", m: true}, {r: "Farmacêutico(a) Clínico", m: false}, {r: "Auxiliar/Técnico de Farmácia", m: false} ],
    "UTI": [ {r: "Coordenador(a) Médico/Enfermagem", m: true}, {r: "Médico(a) Plantonista", m: false}, {r: "Fisioterapeuta Intensivista", m: false} ],
    "Centro Cirúrgico": [ {r: "Coordenador(a) do Bloco", m: true}, {r: "Enfermeiro(a) Assistencial", m: false}, {r: "Instrumentador(a) / Circulante", m: false} ],
    "Laboratório": [ {r: "Biomédico(a) RT", m: true}, {r: "Técnico(a) de Laboratório", m: false} ],
    "Radiologia": [ {r: "Médico(a) Radiologista", m: true}, {r: "Técnico(a) em Radiologia", m: false} ],
    "Recepção": [ {r: "Supervisor(a) de Atendimento", m: true}, {r: "Recepcionista", m: false} ],
    "CCIH": [ {r: "Médico(a) Infectologista", m: true}, {r: "Enfermeiro(a) SCIH", m: true} ],
    "Nutrição": [ {r: "Nutricionista RT", m: true}, {r: "Nutricionista Clínico", m: false}, {r: "Copeiro(a)", m: false} ],
    "Manutenção": [ {r: "Engenheiro(a) Clínico/Predial", m: true}, {r: "Técnico(a) de Manutenção", m: false} ]
};
function getRolesFor(sec) { return ROLES_CONTEXT[sec] || [ {r: "Coordenador(a) / Gestor(a)", m: true}, {r: "Equipe Assistencial/Operacional", m: false} ]; }

// --- ESTADO ---
let S = { templates: [], records: [], users: [], hosp: "Hospital São Lucas", logo: "", view: "home", sel: null, selRec: null, filter: "Todos" };
let VALS = {};

const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const createField = (label, type, req = false, opts = "", hint = "") => ({ id: uid(), label, type, req, opts, hint });

function showToast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    const t = document.createElement("div"); t.className = `toast-custom ${type}`; 
    const icon = type === "success" ? "fa-circle-check text-success" : "fa-circle-exclamation text-danger";
    t.innerHTML = `<i class="fa-solid ${icon} me-2"></i>${msg}`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

async function hashPass(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- CONTROLE DE PERMISSÕES ---
const getMe = () => S.users.find(u => u.id === S.me);
const getTemplate = (id) => S.templates.find(t => t.id === id);

const canEdit = (sec) => { 
    const u = getMe(); 
    return u && (u.admin || (u.sector === sec && u.isManager)); 
};

/**
 * MODELOS PADRÃO (formato de campo: [rótulo, tipo, obrigatório, opções])
 */
const DEFAULT_TEMPLATES = [
    // ===================== TI =====================
    { sector: "TI", code: "TI-FOR-001", title: "Solicitação de Suporte Técnico", owner: "Gestão de TI", objective: "Registrar e priorizar chamados de TI.", protocol: "Descreva o problema com detalhes.",
      fields: [ ["Dados do solicitante", "section"], ["Nome do solicitante", "text", true], ["Setor", "text", true], ["Tipo de chamado", "select", true, "Hardware, Software, Rede, Outros"], ["Descrição do problema", "textarea", true], ["Técnico responsável", "sign"] ] },

    { sector: "TI", code: "TI-FOR-002", title: "Solicitação de Acesso a Sistemas", owner: "Gestão de TI", objective: "Controlar concessão, alteração e revogação de acessos.", protocol: "A solicitação deve ser aprovada pelo gestor do setor antes da liberação.",
      fields: [ ["Dados do colaborador", "section"], ["Nome completo", "text", true], ["Cargo / Função", "text", true], ["Setor", "text", true], ["Tipo de solicitação", "select", true, "Novo acesso, Alteração de perfil, Revogação"], ["Sistemas solicitados", "table", true, "Sistema, Perfil de acesso, Justificativa"], ["Data de início", "date", true], ["Aprovação", "section"], ["Gestor do setor", "sign", true], ["Responsável de TI", "sign"] ] },

    { sector: "TI", code: "TI-FOR-003", title: "Registro de Incidente de Segurança da Informação", owner: "Gestão de TI", objective: "Documentar incidentes que envolvam dados, sistemas ou equipamentos (LGPD).", protocol: "Notificar imediatamente o gestor de TI em caso de vazamento de dados de pacientes.",
      fields: [ ["Identificação", "section"], ["Data da ocorrência", "date", true], ["Hora", "time", true], ["Notificante", "text", true], ["Tipo de incidente", "select", true, "Acesso indevido, Perda de equipamento, Malware, Vazamento de dados, Outros"], ["Dados de pacientes envolvidos?", "check", true], ["Descrição do incidente", "textarea", true], ["Ações de contenção", "list"], ["Responsável pela análise", "sign"] ] },

    // ===================== ENFERMAGEM =====================
    { sector: "Enfermagem", code: "ENF-FOR-001", title: "Evolução de Enfermagem", owner: "Coordenação de Enfermagem", objective: "Registrar a evolução clínica e os cuidados prestados ao paciente.", protocol: "Registrar de forma objetiva, com data, hora e identificação do profissional.",
      fields: [ ["Identificação do paciente", "section"], ["Nome do paciente", "text", true], ["Prontuário", "text", true], ["Leito", "text"], ["Data", "date", true], ["Hora", "time", true], ["Avaliação", "section"], ["Nível de consciência", "select", true, "Alerta, Sonolento, Torporoso, Comatoso"], ["Sinais vitais", "table", true, "PA, FC, FR, Temp., SpO2"], ["Dor (escala 0-10)", "number"], ["Evolução / Intercorrências", "textarea", true], ["Cuidados realizados", "list"], ["Profissional responsável", "sign", true] ] },

    { sector: "Enfermagem", code: "ENF-FOR-002", title: "Passagem de Plantão", owner: "Coordenação de Enfermagem", objective: "Padronizar a transferência de informações entre turnos (SBAR).", protocol: "Realizar a passagem à beira-leito sempre que possível.",
      fields: [ ["Dados do plantão", "section"], ["Data", "date", true], ["Turno", "select", true, "Manhã, Tarde, Noite A, Noite B"], ["Unidade", "text", true], ["Pacientes", "section"], ["Resumo por paciente", "table", true, "Leito, Paciente, Situação/Diagnóstico, Pendências"], ["Intercorrências do turno", "textarea"], ["Equipamentos / Materiais com problema", "list"], ["Profissional que passa o plantão", "sign", true], ["Profissional que recebe o plantão", "sign", true] ] },

    { sector: "Enfermagem", code: "ENF-FOR-003", title: "Notificação de Queda de Paciente", owner: "Núcleo de Segurança do Paciente", objective: "Registrar quedas e subsidiar ações preventivas.", protocol: "Notificar em até 24 horas após o evento.",
      fields: [ ["Dados do paciente", "section"], ["Nome do paciente", "text", true], ["Prontuário", "text", true], ["Idade", "number"], ["Dados do evento", "section"], ["Data do evento", "date", true], ["Hora do evento", "time", true], ["Local da queda", "select", true, "Leito, Banheiro, Corredor, Poltrona, Outro"], ["Risco de queda avaliado previamente?", "check", true], ["Houve dano ao paciente?", "check", true], ["Grau do dano", "select", false, "Nenhum, Leve, Moderado, Grave, Óbito"], ["Descrição do evento", "textarea", true], ["Medidas adotadas", "list"], ["Notificante", "sign", true] ] },

    { sector: "Enfermagem", code: "ENF-FOR-004", title: "Checklist de Administração Segura de Medicamentos", owner: "Coordenação de Enfermagem", objective: "Garantir a conferência dos 9 certos na administração.", protocol: "Conferir todos os itens antes de administrar.",
      fields: [ ["Paciente", "section"], ["Nome do paciente", "text", true], ["Leito", "text"], ["Medicamento", "text", true], ["Conferência (9 certos)", "section"], ["Paciente certo", "check", true], ["Medicamento certo", "check", true], ["Dose certa", "check", true], ["Via certa", "check", true], ["Hora certa", "check", true], ["Registro certo", "check", true], ["Alergias verificadas", "check", true], ["Observações", "textarea"], ["Profissional", "sign", true] ] },

    // ===================== UTI =====================
    { sector: "UTI", code: "UTI-FOR-001", title: "Balanço Hídrico", owner: "Coordenação da UTI", objective: "Controlar entradas e saídas de líquidos do paciente crítico.", protocol: "Fechar o balanço a cada 6 e 24 horas.",
      fields: [ ["Paciente", "section"], ["Nome do paciente", "text", true], ["Leito", "text", true], ["Data", "date", true], ["Peso (kg)", "number"], ["Entradas", "table", true, "Horário, Via/Tipo, Volume (mL)"], ["Saídas", "table", true, "Horário, Tipo (diurese, dreno, etc.), Volume (mL)"], ["Balanço parcial (mL)", "number"], ["Balanço total 24h (mL)", "number"], ["Responsável", "sign", true] ] },

    { sector: "UTI", code: "UTI-FOR-002", title: "Checklist Diário Multiprofissional (FAST HUG)", owner: "Coordenação da UTI", objective: "Revisar diariamente medidas de segurança e prevenção de complicações.", protocol: "Aplicar durante o round multiprofissional.",
      fields: [ ["Identificação", "section"], ["Paciente", "text", true], ["Leito", "text", true], ["Data", "date", true], ["Itens avaliados", "section"], ["Alimentação (Feeding) adequada", "check", true], ["Analgesia / Sedação revisadas", "check", true], ["Profilaxia de TVP", "check", true], ["Cabeceira elevada 30-45°", "check", true], ["Profilaxia de úlcera de estresse", "check", true], ["Controle glicêmico", "check", true], ["Necessidade de manter dispositivos invasivos", "check", true], ["Metas do dia", "list"], ["Médico(a) responsável", "sign", true] ] },

    // ===================== CENTRO CIRÚRGICO =====================
    { sector: "Centro Cirúrgico", code: "CC-FOR-001", title: "Checklist de Cirurgia Segura (OMS)", owner: "Coordenação do Bloco", objective: "Reduzir eventos adversos cirúrgicos por meio de verificação em três momentos.", protocol: "Aplicar em voz alta, com toda a equipe presente.",
      fields: [ ["Identificação", "section"], ["Paciente", "text", true], ["Procedimento", "text", true], ["Sala", "text"], ["Data", "date", true], ["Antes da indução anestésica (Sign In)", "section"], ["Identidade, local e procedimento confirmados", "check", true], ["Consentimento assinado", "check", true], ["Sítio cirúrgico demarcado", "check", true], ["Alergias conhecidas verificadas", "check", true], ["Antes da incisão (Time Out)", "section"], ["Equipe se apresentou e confirmou o procedimento", "check", true], ["Antibiótico profilático administrado", "check", true], ["Imagens essenciais disponíveis", "check"], ["Antes da saída da sala (Sign Out)", "section"], ["Contagem de compressas e instrumentais correta", "check", true], ["Peças cirúrgicas identificadas", "check", true], ["Enfermeiro(a) circulante", "sign", true], ["Cirurgião(ã)", "sign", true] ] },

    { sector: "Centro Cirúrgico", code: "CC-FOR-002", title: "Registro de Contagem de Compressas e Instrumentais", owner: "Coordenação do Bloco", objective: "Prevenir retenção de corpos estranhos.", protocol: "Realizar contagem antes, durante e ao final do procedimento.",
      fields: [ ["Dados do procedimento", "section"], ["Paciente", "text", true], ["Procedimento", "text", true], ["Data", "date", true], ["Contagem", "section"], ["Itens contados", "table", true, "Item, Contagem inicial, Adicionados, Contagem final"], ["Contagem final confere?", "check", true], ["Conduta em caso de divergência", "textarea"], ["Instrumentador(a)", "sign", true], ["Circulante", "sign", true] ] },

    // ===================== FARMÁCIA =====================
    { sector: "Farmácia", code: "FAR-FOR-001", title: "Dispensação de Medicamentos Controlados", owner: "Farmacêutico(a) RT", objective: "Registrar a dispensação de medicamentos sujeitos a controle especial (Portaria 344/98).", protocol: "Exigir prescrição/receita válida e conferir identificação do paciente.",
      fields: [ ["Paciente / Prescrição", "section"], ["Nome do paciente", "text", true], ["Prontuário", "text"], ["Prescritor (nome e CRM)", "text", true], ["Número da receita / notificação", "text", true], ["Medicamentos", "section"], ["Itens dispensados", "table", true, "Medicamento, Lote, Quantidade, Validade"], ["Data da dispensação", "date", true], ["Farmacêutico(a) responsável", "sign", true], ["Profissional que recebeu", "sign", true] ] },

    { sector: "Farmácia", code: "FAR-FOR-002", title: "Controle de Temperatura de Refrigeradores", owner: "Farmacêutico(a) RT", objective: "Garantir a conservação de medicamentos termolábeis (2 a 8 °C).", protocol: "Registrar duas vezes ao dia. Temperaturas fora da faixa devem ser notificadas imediatamente.",
      fields: [ ["Equipamento", "section"], ["Identificação do refrigerador", "text", true], ["Mês / Ano de referência", "text", true], ["Registros", "section"], ["Leituras diárias", "table", true, "Dia, Hora, Temp. atual (°C), Mín. (°C), Máx. (°C)"], ["Houve desvio de temperatura?", "check", true], ["Ação corretiva adotada", "textarea"], ["Responsável pela verificação", "sign", true] ] },

    // ===================== LABORATÓRIO =====================
    { sector: "Laboratório", code: "LAB-FOR-001", title: "Controle de Qualidade Interno", owner: "Biomédico(a) RT", objective: "Registrar resultados dos controles internos das análises.", protocol: "Realizar o controle antes de iniciar a rotina e a cada troca de lote de reagente.",
      fields: [ ["Identificação", "section"], ["Data", "date", true], ["Equipamento / Método", "text", true], ["Analito", "text", true], ["Nível do controle", "select", true, "Normal, Patológico, Alto"], ["Lote do controle", "text", true], ["Resultado obtido", "number", true], ["Faixa aceitável", "text", true], ["Resultado dentro do aceitável?", "check", true], ["Ação corretiva", "textarea"], ["Analista", "sign", true] ] },

    { sector: "Laboratório", code: "LAB-FOR-002", title: "Registro de Não Conformidade de Amostra", owner: "Biomédico(a) RT", objective: "Documentar amostras recusadas ou com problemas pré-analíticos.", protocol: "Comunicar o setor de origem e solicitar nova coleta quando necessário.",
      fields: [ ["Amostra", "section"], ["Paciente", "text", true], ["Número da amostra", "text", true], ["Setor de origem", "text", true], ["Data / Hora da coleta", "text"], ["Motivo", "select", true, "Hemólise, Volume insuficiente, Identificação incorreta, Coagulada, Tubo inadequado, Outros"], ["Detalhes", "textarea"], ["Setor foi comunicado?", "check", true], ["Nova coleta solicitada?", "check", true], ["Responsável", "sign", true] ] },

    // ===================== RADIOLOGIA =====================
    { sector: "Radiologia", code: "RAD-FOR-001", title: "Termo de Consentimento para Uso de Contraste", owner: "Médico(a) Radiologista", objective: "Registrar triagem de risco e consentimento para exames com contraste.", protocol: "Realizar a triagem antes da administração do contraste.",
      fields: [ ["Paciente", "section"], ["Nome do paciente", "text", true], ["Data de nascimento", "date", true], ["Exame", "text", true], ["Triagem de risco", "section"], ["Alergia prévia a contraste?", "check", true], ["Histórico de asma / alergias graves?", "check", true], ["Insuficiência renal?", "check", true], ["Creatinina (mg/dL)", "number"], ["Uso de metformina?", "check", true], ["Possibilidade de gravidez?", "check"], ["Paciente / Responsável", "sign", true], ["Médico(a) responsável", "sign", true] ] },

    { sector: "Radiologia", code: "RAD-FOR-002", title: "Registro Diário de Exames Realizados", owner: "Técnico(a) em Radiologia", objective: "Controlar produção e rastrear exames por equipamento.", protocol: "Preencher ao término de cada turno.",
      fields: [ ["Dados do turno", "section"], ["Data", "date", true], ["Equipamento", "select", true, "Raio-X Fixo, Raio-X Portátil, Tomografia, Ressonância, Mamografia"], ["Exames", "table", true, "Hora, Paciente, Exame, Dose/Parâmetros, Intercorrência"], ["Total de exames", "number"], ["Técnico(a) responsável", "sign", true] ] },

    // ===================== RECEPÇÃO =====================
    { sector: "Recepção", code: "REC-FOR-001", title: "Registro de Manifestação do Paciente / Ouvidoria", owner: "Supervisão de Atendimento", objective: "Registrar elogios, sugestões e reclamações.", protocol: "Dar retorno ao paciente em até 5 dias úteis.",
      fields: [ ["Identificação", "section"], ["Nome (opcional)", "text"], ["Telefone / E-mail para retorno", "text"], ["Data", "date", true], ["Manifestação", "section"], ["Tipo", "select", true, "Elogio, Sugestão, Reclamação, Denúncia"], ["Setor envolvido", "text", true], ["Descrição", "textarea", true], ["Encaminhamento", "textarea"], ["Responsável pelo registro", "sign", true] ] },

    { sector: "Recepção", code: "REC-FOR-002", title: "Controle de Visitantes", owner: "Supervisão de Atendimento", objective: "Registrar entrada e saída de visitantes e acompanhantes.", protocol: "Conferir documento com foto e informar as regras da unidade.",
      fields: [ ["Data", "date", true], ["Setor / Unidade", "text", true], ["Visitantes", "table", true, "Nome, Documento, Paciente visitado, Leito, Entrada, Saída"], ["Recepcionista responsável", "sign", true] ] },

    // ===================== CCIH =====================
    { sector: "CCIH", code: "CCIH-FOR-001", title: "Notificação de Infecção Relacionada à Assistência (IRAS)", owner: "Comissão de Controle de Infecção Hospitalar", objective: "Registrar e investigar casos de IRAS para vigilância epidemiológica.", protocol: "Notificar à CCIH em até 24 horas após o diagnóstico.",
      fields: [ ["Paciente", "section"], ["Nome do paciente", "text", true], ["Prontuário", "text", true], ["Unidade / Leito", "text", true], ["Data de internação", "date", true], ["Infecção", "section"], ["Topografia", "select", true, "Corrente sanguínea (IPCS), Trato urinário (ITU-CVD), Pneumonia (PAV), Sítio cirúrgico (ISC), Outras"], ["Data do diagnóstico", "date", true], ["Dispositivo invasivo em uso", "select", false, "Nenhum, CVC, SVD, Ventilação mecânica, Dreno"], ["Microrganismo isolado", "text"], ["Perfil de resistência", "text"], ["Medidas de controle adotadas", "list"], ["Notificante", "sign", true] ] },

    { sector: "CCIH", code: "CCIH-FOR-002", title: "Auditoria de Higienização das Mãos", owner: "Comissão de Controle de Infecção Hospitalar", objective: "Monitorar a adesão aos 5 momentos de higienização das mãos.", protocol: "Observar sem interferir na rotina e registrar oportunidades e ações realizadas.",
      fields: [ ["Dados da observação", "section"], ["Data", "date", true], ["Unidade observada", "text", true], ["Observador", "text", true], ["Observações", "table", true, "Categoria profissional, Momento (1 a 5), Higienizou? (Sim/Não), Técnica (álcool/água e sabão)"], ["Total de oportunidades", "number"], ["Total de adesões", "number"], ["Comentários / Feedback ao setor", "textarea"], ["Responsável pela auditoria", "sign", true] ] },

    // ===================== NUTRIÇÃO =====================
    { sector: "Nutrição", code: "NUT-FOR-001", title: "Triagem Nutricional", owner: "Nutricionista RT", objective: "Identificar risco nutricional nas primeiras 48 horas de internação.", protocol: "Reavaliar semanalmente pacientes em risco.",
      fields: [ ["Paciente", "section"], ["Nome do paciente", "text", true], ["Leito", "text"], ["Data", "date", true], ["Antropometria", "section"], ["Peso atual (kg)", "number", true], ["Altura (m)", "number", true], ["IMC", "number"], ["Perda de peso não intencional (últimos 3 meses)?", "check", true], ["Ingestão alimentar reduzida?", "check", true], ["Doença grave / Estresse metabólico?", "check", true], ["Classificação de risco", "select", true, "Sem risco, Risco moderado, Alto risco"], ["Conduta nutricional", "textarea"], ["Nutricionista", "sign", true] ] },

    { sector: "Nutrição", code: "NUT-FOR-002", title: "Controle de Temperatura de Refeições", owner: "Nutricionista RT", objective: "Garantir segurança sanitária na distribuição de refeições.", protocol: "Pratos quentes ≥ 60 °C e frios ≤ 10 °C.",
      fields: [ ["Data", "date", true], ["Refeição", "select", true, "Desjejum, Almoço, Lanche, Jantar, Ceia"], ["Aferições", "table", true, "Preparação, Tipo (quente/frio), Temperatura (°C), Horário"], ["Houve não conformidade?", "check", true], ["Ação corretiva", "textarea"], ["Responsável", "sign", true] ] },

    // ===================== MANUTENÇÃO =====================
    { sector: "Manutenção", code: "MAN-FOR-001", title: "Ordem de Serviço de Manutenção", owner: "Engenharia Clínica/Predial", objective: "Registrar e acompanhar solicitações de manutenção corretiva.", protocol: "Classificar a urgência conforme impacto assistencial.",
      fields: [ ["Solicitação", "section"], ["Setor solicitante", "text", true], ["Data da solicitação", "date", true], ["Tipo de serviço", "select", true, "Elétrica, Hidráulica, Climatização, Civil, Equipamento médico, Outros"], ["Prioridade", "select", true, "Baixa, Média, Alta, Emergência"], ["Descrição do problema", "textarea", true], ["Execução", "section"], ["Data de execução", "date"], ["Serviço realizado", "textarea"], ["Materiais utilizados", "table", false, "Item, Quantidade"], ["Técnico executor", "sign"], ["Aceite do solicitante", "sign"] ] },

    { sector: "Manutenção", code: "MAN-FOR-002", title: "Manutenção Preventiva de Equipamento Médico", owner: "Engenharia Clínica/Predial", objective: "Documentar inspeções e calibrações preventivas programadas.", protocol: "Seguir o plano de manutenção do fabricante.",
      fields: [ ["Equipamento", "section"], ["Descrição / Modelo", "text", true], ["Patrimônio / Nº de série", "text", true], ["Setor", "text", true], ["Intervenção", "section"], ["Data", "date", true], ["Itens verificados", "table", true, "Item, Conforme? (Sim/Não), Observação"], ["Calibração realizada?", "check", true], ["Equipamento liberado para uso?", "check", true], ["Próxima manutenção prevista", "date"], ["Engenheiro(a) / Técnico(a)", "sign", true] ] }
];

/**
 * Semeia os modelos padrão. Adiciona apenas os que ainda não existem (por código),
 * então pode ser executado novamente após atualizar a lista sem duplicar nada.
 */
function seedTemplates() {
    const SEED_KEY = "sipad_seed_v3"; // nova chave: força a inclusão dos novos modelos
    let done = false;
    try { done = localStorage.getItem(SEED_KEY) === "1"; } catch (e) {}
    if (done) return;

    const today = new Date().toISOString().slice(0, 10);
    let added = 0;
    DEFAULT_TEMPLATES.forEach(d => {
        if (S.templates.some(t => t.code === d.code)) return;
        S.templates.push({
            id: uid(), code: d.code, title: d.title, sector: d.sector, version: "1.0",
            validity: today, owner: d.owner, objective: d.objective, protocol: d.protocol,
            printable: true, logo: "",
            fields: d.fields.map(([label, type, req, opts]) => createField(label, type, !!req, opts || ""))
        });
        added++;
    });
    if (added) saveDB();
    try { localStorage.setItem(SEED_KEY, "1"); } catch (e) {}
}

// --- INICIALIZAÇÃO ---
async function boot() {
    try { const local = JSON.parse(localStorage.getItem("sipad_db")); if (local) Object.assign(S, local); } catch(e) {}
    
    if (!S.users.length) {
        S.users.push({ id: uid(), name: "Admin TI", login: "admin", hash: await hashPass("admin123"), sector: "TI", role: "Gestor(a) de TI", isManager: true, admin: true });
        S.users.push({ id: uid(), name: "Coordenadora Maria", login: "coord.enf", hash: await hashPass("enf123"), sector: "Enfermagem", role: "Enfermeiro(a) Coordenador(a)", isManager: true, admin: false });
    }

    seedTemplates();

    // Verificação de autenticação (Session ou Local Storage para "Lembrar-me")
    try { 
        S.me = localStorage.getItem("sipad_me") || sessionStorage.getItem("sipad_me") || null; 
    } catch(e) { S.me = null; }
    
    document.documentElement.setAttribute("data-bs-theme", localStorage.getItem("sipad_theme") || "light");
    render();
}
function saveDB() { localStorage.setItem("sipad_db", JSON.stringify({ templates: S.templates, records: S.records, users: S.users, hosp: S.hosp, logo: S.logo })); }

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-bs-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-bs-theme", next); 
    localStorage.setItem("sipad_theme", next);
}

// --- ROTEAMENTO ---
function render() {
    closeMenu();
    const app = document.getElementById("app");
    const nav = document.getElementById("navbar");
    const uInfo = document.getElementById("user-info");
    const user = getMe();

    if (!user) { nav.innerHTML = ""; uInfo.innerHTML = ""; app.innerHTML = viewLogin(); return; }

    const menu = [ 
        { id: "home", label: "Dashboard", icon: "fa-chart-pie" }, 
        { id: "lib", label: "Modelos & Editor", icon: "fa-file-lines" }, 
        { id: "records", label: "Registros", icon: "fa-folder-open" } 
    ];
    if (user.admin) menu.push({ id: "config", label: "Configurações", icon: "fa-gear" });

    // 1. Menu de navegação principal
    nav.innerHTML = menu.map(m => `
        <button class="nav-btn ${S.view === m.id || (S.view === 'edit' && m.id === 'lib') || (S.view === 'fill' && m.id === 'lib') ? 'active' : ''}" onclick="S.view='${m.id}'; render()">
            <i class="fa-solid ${m.icon} fa-fw me-3 opacity-75"></i>${esc(m.label)}
        </button>`).join("");
    
    // 2. Separador e Botão de Tema no Menu
    nav.innerHTML += `
        <div class="mt-4 mb-2 px-3">
            <span class="text-uppercase text-secondary fw-bold" style="font-size: 0.65rem; letter-spacing: 1px;">Preferências</span>
        </div>
        <button class="nav-btn" onclick="toggleTheme()">
            <i class="fa-solid fa-circle-half-stroke fa-fw me-3 opacity-75"></i> Alternar Tema
        </button>`;
    
    // 3. Área do Utilizador (Rodapé) em formato de "Cartão"
    const tagPriv = user.admin ? '<span class="badge bg-danger ms-2" style="font-size: 0.65rem;">Admin</span>' : (user.isManager ? '<span class="badge bg-success ms-2" style="font-size: 0.65rem;">Gestor</span>' : '');
    
    uInfo.innerHTML = `
        <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
            <div class="d-flex flex-column overflow-hidden pe-2">
                <div class="d-flex align-items-center mb-1">
                    <strong class="text-white text-truncate mb-0" style="font-size: 0.9rem;">${esc(user.name)}</strong>
                    ${tagPriv}
                </div>
                <span class="text-secondary text-truncate" style="font-size: 0.75rem;">
                    ${esc(user.sector)} • ${esc(user.role || 'Utilizador')}
                </span>
            </div>
            <button class="btn btn-sm btn-outline-danger border-0 px-2 py-1" onclick="logout()" title="Sair do sistema">
                <i class="fa-solid fa-power-off"></i>
            </button>
        </div>
    `;

    const viewHtml = {
        "home": viewHome, "lib": viewLib, "edit": viewEdit,
        "fill": viewFill, "records": viewRecords, "config": viewConfig
    };
    app.innerHTML = `<div class="content-wrapper">${(viewHtml[S.view] || viewHome)()}</div>`;
}

// --- TELAS ---
function viewLogin() {
    return `
    <div class="row w-100 justify-content-center align-items-center">
        <div class="col-12 col-sm-8 col-md-6 col-lg-4">
            <div class="card shadow-sm border-0">
                <div class="card-body p-4 p-sm-5 text-center">
                    <div class="mb-4">
                        <i class="fa-solid fa-hospital fa-3x text-primary"></i>
                    </div>
                    <h4 class="mb-1 fw-bold">Acesso Corporativo</h4>
                    <p class="text-muted small mb-4">Insira suas credenciais institucionais</p>
                    
                    <div class="mb-3 text-start">
                        <label class="form-label fw-medium small">Usuário</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fa-solid fa-user text-muted"></i></span>
                            <input type="text" id="lg_u" class="form-control" placeholder="Ex: admin">
                        </div>
                    </div>
                    
                    <div class="mb-3 text-start">
                        <label class="form-label fw-medium small">Senha</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fa-solid fa-lock text-muted"></i></span>
                            <input type="password" id="lg_p" class="form-control" onkeypress="if(event.key==='Enter') doLogin()">
                        </div>
                    </div>

                    <div class="form-check text-start mb-4">
                        <input class="form-check-input" type="checkbox" id="lg_rem">
                        <label class="form-check-label text-muted small" for="lg_rem">Lembrar-me neste dispositivo</label>
                    </div>

                    <button class="btn btn-primary w-100 py-2 fw-semibold" onclick="doLogin()">
                        <i class="fa-solid fa-right-to-bracket me-2"></i> Autenticar
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

async function doLogin() {
    const u = document.getElementById("lg_u").value.trim().toLowerCase();
    const p = document.getElementById("lg_p").value;
    const hashedPass = await hashPass(p);
    const user = S.users.find(x => x.login === u && x.hash === hashedPass);
    if (user) { 
        S.me = user.id; 
        
        // Lógica do Lembrar-me
        if (document.getElementById("lg_rem").checked) {
            localStorage.setItem("sipad_me", user.id);
        } else {
            sessionStorage.setItem("sipad_me", user.id);
        }
        
        S.view = "home"; 
        showToast(`Bem-vindo, ${user.name}`); 
        render(); 
    } 
    else { showToast("Credenciais inválidas", "error"); }
}

function logout() { 
    S.me = null; 
    localStorage.removeItem("sipad_me");
    sessionStorage.removeItem("sipad_me"); 
    S.view = "home"; 
    render(); 
}

function viewHome() {
    return `
    <div class="card shadow-sm border-0 mb-4 bg-primary text-white">
        <div class="card-body p-4 p-md-5 position-relative overflow-hidden">
            <h2 class="fw-bold mb-3">Painel de Gestão Documental</h2>
            <p class="opacity-75 mb-4" style="max-width: 600px;">Acompanhe os indicadores institucionais e gere novos registros de forma padronizada e segura sob as normativas de qualidade.</p>
            <div class="row g-3 position-relative z-1">
                <div class="col-sm-6 col-md-4">
                    <div class="bg-white bg-opacity-10 p-3 rounded border border-white border-opacity-25">
                        <h3 class="fw-bold mb-0">${S.templates.length}</h3>
                        <small class="text-uppercase opacity-75">Modelos Ativos</small>
                    </div>
                </div>
                <div class="col-sm-6 col-md-4">
                    <div class="bg-white bg-opacity-10 p-3 rounded border border-white border-opacity-25">
                        <h3 class="fw-bold mb-0">${S.records.length}</h3>
                        <small class="text-uppercase opacity-75">Registros Emitidos</small>
                    </div>
                </div>
                <div class="col-sm-6 col-md-4">
                    <div class="bg-white bg-opacity-10 p-3 rounded border border-white border-opacity-25">
                        <h3 class="fw-bold mb-0">${new Set(S.templates.map(t=>t.sector)).size}</h3>
                        <small class="text-uppercase opacity-75">Setores Atendidos</small>
                    </div>
                </div>
            </div>
            <i class="fa-solid fa-hospital position-absolute text-white opacity-10" style="font-size: 15rem; right: -2rem; bottom: -3rem; pointer-events: none;"></i>
        </div>
    </div>

    <div class="row g-4">
        <div class="col-md-6">
            <div class="card shadow-sm h-100 border-0 text-center text-decoration-none" style="cursor:pointer;" onclick="S.view='lib'; render()">
                <div class="card-body p-4 py-5">
                    <i class="fa-solid fa-file-circle-plus fa-3x text-primary mb-3"></i>
                    <h5 class="fw-bold">Nova Documentação</h5>
                    <p class="text-muted small mb-0">Acessar a biblioteca de modelos e preencher um formulário em branco.</p>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card shadow-sm h-100 border-0 text-center text-decoration-none" style="cursor:pointer;" onclick="S.view='records'; render()">
                <div class="card-body p-4 py-5">
                    <i class="fa-solid fa-server fa-3x text-primary mb-3"></i>
                    <h5 class="fw-bold">Consultar Registros</h5>
                    <p class="text-muted small mb-0">Acessar o histórico de documentos e consultar auditorias passadas.</p>
                </div>
            </div>
        </div>
    </div>`;
}

function viewLib() {
    const list = S.templates.filter(t => S.filter === "Todos" || t.sector === S.filter);
    const user = getMe();

    return `
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
            <h3 class="fw-bold mb-1">Biblioteca de Modelos</h3>
            <p class="text-muted small mb-0">Formulários padronizados aprovados pela Qualidade</p>
        </div>
        ${user.isManager || user.admin ? `<button class="btn btn-primary shadow-sm" onclick="createTemplate()"><i class="fa-solid fa-plus me-2"></i>Novo Modelo</button>` : ''}
    </div>
    
    <div class="mb-4 d-flex flex-wrap gap-2">
        ${["Todos", ...SECTORS].map(s => `<button class="btn btn-sm ${S.filter === s ? 'btn-primary' : 'btn-outline-secondary'}" onclick="S.filter='${s}'; render()">${s}</button>`).join("")}
    </div>

    <div class="row g-4">
        ${list.length ? list.map(t => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle">${esc(t.sector)}</span>
                            <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">v${esc(t.version)}</span>
                        </div>
                        <h5 class="fw-bold mb-1">${esc(t.title)}</h5>
                        <p class="text-muted small mb-3 flex-grow-1">${esc(t.code)}</p>
                        
                        <div class="d-flex flex-wrap gap-2 mt-auto pt-3 border-top">
                            <button class="btn btn-sm btn-primary flex-grow-1" onclick="startFill('${t.id}')">Preencher</button>
                            ${t.printable !== false ? `<button class="btn btn-sm btn-outline-secondary" onclick="printTemplate('${t.id}')" title="Imprimir formulário em branco"><i class="fa-solid fa-print"></i></button>` : `<button class="btn btn-sm btn-outline-secondary disabled" title="Sem impressão"><i class="fa-solid fa-ban"></i></button>`}
                            ${canEdit(t.sector) ? `
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                    <ul class="dropdown-menu dropdown-menu-end shadow">
                                        <li><a class="dropdown-item" href="#" onclick="S.sel='${t.id}'; S.view='edit'; render()"><i class="fa-solid fa-pen-to-square me-2 text-muted"></i>Editar Estrutura</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item text-danger" href="#" onclick="delTemplate('${t.id}')"><i class="fa-solid fa-trash me-2"></i>Excluir Modelo</a></li>
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join("") : `<div class="col-12"><div class="p-5 text-center border rounded border-dashed text-muted"><i class="fa-regular fa-folder-open fa-3x mb-3 opacity-50"></i><p>Nenhum modelo cadastrado nesta categoria.</p></div></div>`}
    </div>`;
}

function createTemplate() {
    const t = { 
        id: uid(), code: "COD-001", title: "Novo Documento", sector: getMe().sector, 
        version: "1.0", validity: new Date().toISOString().slice(0,10), 
        owner: getMe().name, objective: "", protocol: "", printable: true, 
        logo: "",
        fields: [createField("Campo Exemplo", "text", true)] 
    };
    S.templates.unshift(t); saveDB(); S.sel = t.id; S.view = "edit"; render();
}
function delTemplate(id) { if (confirm("Deseja excluir permanentemente este modelo?")) { S.templates = S.templates.filter(x => x.id !== id); saveDB(); render(); showToast("Excluído com sucesso"); } }

function viewEdit() {
    const t = getTemplate(S.sel); if (!t) return "Erro.";
    return `
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 class="fw-bold mb-0">Editor de Estrutura Documental</h3>
        <div class="gap-2 d-flex">
            <button class="btn btn-outline-secondary bg-body" onclick="S.view='lib'; render()"><i class="fa-solid fa-arrow-left me-2"></i>Voltar</button>
            <button class="btn btn-primary" onclick="startFill('${t.id}')"><i class="fa-solid fa-eye me-2"></i>Pré-visualizar</button>
        </div>
    </div>
    
    <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-transparent border-bottom-0 pt-4 pb-0">
            <h5 class="text-primary fw-bold mb-0"><i class="fa-solid fa-1 me-2"></i>Identificação Corporativa</h5>
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label small fw-medium">Título do Documento</label>
                    <input type="text" class="form-control" value="${esc(t.title)}" onchange="updateT('title', this.value)">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-medium">Código Interno (Ex: SGDP-001)</label>
                    <input type="text" class="form-control" value="${esc(t.code)}" onchange="updateT('code', this.value)">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-medium">Setor Proprietário</label>
                    <select class="form-select" onchange="updateT('sector', this.value)" ${getMe().admin ? '' : 'disabled'}>
                        ${SECTORS.map(s => `<option ${t.sector === s ? 'selected' : ''}>${s}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-medium">Versão Vigente</label>
                    <input type="text" class="form-control" value="${esc(t.version)}" onchange="updateT('version', this.value)">
                </div>
                
                <!-- Logótipo do Modelo -->
                <div class="col-12 mt-3">
                    <label class="form-label small fw-medium">Logótipo Específico do Modelo <span class="text-muted fw-normal">(Substitui o logótipo global da instituição)</span></label>
                    <div class="d-flex align-items-center gap-3">
                        <input type="file" class="form-control form-control-sm w-auto" accept="image/*" onchange="loadTemplateLogo(this)">
                        ${t.logo ? `<div class="bg-light p-1 rounded border border-secondary-subtle"><img src="${esc(t.logo)}" style="max-height: 35px; object-fit: contain;"></div><button class="btn btn-sm btn-outline-danger border-0" onclick="updateT('logo', ''); render()" title="Remover Logótipo"><i class="fa-solid fa-trash"></i></button>` : `<span class="text-muted small"><i class="fa-solid fa-circle-info me-1"></i>Usa o logótipo padrão caso vazio.</span>`}
                    </div>
                </div>
                
                <div class="col-12">
                    <div class="form-check mt-2">
                        <input class="form-check-input" type="checkbox" id="t_print" ${t.printable !== false ? 'checked' : ''} onchange="updateT('printable', this.checked)"> 
                        <label class="form-check-label fw-medium" for="t_print">Permitir Impressão / Exportação em PDF deste documento</label>
                    </div>
                </div>
                <div class="col-12">
                    <label class="form-label small fw-medium mt-2">Protocolo / Instruções de Preenchimento</label>
                    <textarea class="form-control" rows="2" onchange="updateT('protocol', this.value)">${esc(t.protocol)}</textarea>
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="text-primary fw-bold mb-0"><i class="fa-solid fa-2 me-2"></i>Configuração de Campos</h5>
        <button class="btn btn-sm btn-outline-primary bg-body" onclick="addField()"><i class="fa-solid fa-plus me-1"></i> Adicionar Campo</button>
    </div>
    
    <div id="fields-container">
        ${t.fields.map((f, i) => `
        <div class="card shadow-sm border-0 mb-3 border-start border-primary border-4">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-3 align-items-center">
                    <span class="badge bg-primary rounded-pill">Posição ${i+1}</span>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-secondary bg-body" onclick="moveField(${i}, -1)" ${i === 0 ? 'disabled' : ''} title="Subir"><i class="fa-solid fa-arrow-up"></i></button>
                        <button class="btn btn-sm btn-outline-secondary bg-body" onclick="moveField(${i}, 1)" ${i === t.fields.length - 1 ? 'disabled' : ''} title="Descer"><i class="fa-solid fa-arrow-down"></i></button>
                        <button class="btn btn-sm btn-outline-danger bg-body" onclick="delField(${i})" title="Remover"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-5">
                        <label class="form-label small fw-medium">Nome do Rótulo (Label)</label>
                        <input type="text" class="form-control" value="${esc(f.label)}" onchange="updateF(${i}, 'label', this.value)">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small fw-medium">Formato de Entrada</label>
                        <select class="form-select" onchange="updateF(${i}, 'type', this.value); render()">
                            ${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${v}</option>`).join("")}
                        </select>
                    </div>
                    <div class="col-md-3 d-flex align-items-end">
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="req_${i}" ${f.req ? 'checked' : ''} onchange="updateF(${i}, 'req', this.checked)">
                            <label class="form-check-label small fw-medium" for="req_${i}">Obrigatório</label>
                        </div>
                    </div>
                    ${['select', 'table'].includes(f.type) ? `
                    <div class="col-12 mt-2">
                        <label class="form-label small fw-medium">Parâmetros <span class="text-muted fw-normal">(${f.type === 'table' ? 'Colunas separadas por vírgula' : 'Opções separadas por vírgula'})</span></label>
                        <input type="text" class="form-control" placeholder="${f.type === 'table' ? 'Ex: Medicamento, Dose, Horário' : 'Ex: Opção A, Opção B'}" value="${esc(f.opts || '')}" onchange="updateF(${i}, 'opts', this.value)">
                    </div>` : ''}
                </div>
            </div>
        </div>
        `).join("")}
    </div>`;
}
function loadTemplateLogo(inp) {
    const f = inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
        const t = getTemplate(S.sel);
        if (t) { 
            t.logo = r.result; 
            saveDB(); 
            render(); 
            showToast("Logótipo do modelo atualizado com sucesso."); 
        }
    };
    r.readAsDataURL(f);
}

function updateT(key, val) { const t = getTemplate(S.sel); t[key] = val; saveDB(); }
function updateF(idx, key, val) { const t = getTemplate(S.sel); t.fields[idx][key] = val; saveDB(); }
function addField() { const t = getTemplate(S.sel); t.fields.push(createField("Novo Campo", "text")); saveDB(); render(); }
function delField(idx) { const t = getTemplate(S.sel); t.fields.splice(idx, 1); saveDB(); render(); }
function moveField(idx, dir) { 
    const t = getTemplate(S.sel); const tgt = idx + dir; if(tgt < 0 || tgt >= t.fields.length) return;
    const temp = t.fields[idx]; t.fields[idx] = t.fields[tgt]; t.fields[tgt] = temp; saveDB(); render();
}

const fmtDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v.split("-").reverse().join("/") : (v || "");

// --- IMPRESSÃO / GERAÇÃO ---
function renderValueHtml(f, v, blank = false) {
    const empty = `<div class="doc-field-val doc-empty">—</div>`;
    switch (f.type) {
        case "check":
            return `<div class="doc-check"><span class="doc-opt ${!blank && v === 'Sim' ? 'sel' : ''}"><i></i>Sim</span><span class="doc-opt ${blank || v === 'Sim' ? '' : 'sel'}"><i></i>Não</span></div>`;
        case "sign":
            return `<div class="doc-sign-line">${esc(v)}</div><div class="doc-sign-cap">Assinatura e carimbo / registro profissional</div>`;
        case "list": {
            const items = (v||"").split("\n").map(x => x.trim()).filter(Boolean);
            if (!items.length) return blank ? `<ul class="doc-list doc-blank-list"><li></li><li></li><li></li></ul>` : empty;
            return `<ul class="doc-list">${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
        }
        case "table": {
            const cols = (f.opts || "Coluna 1").split(",").map(c => c.trim()).filter(Boolean);
            let rows = (v||"").split("\n").filter(Boolean).map(r => r.split("|").map(c => c.trim()));
            if (!rows.length) rows = Array.from({ length: blank ? 4 : 2 }, () => cols.map(() => ""));
            return `<table class="table table-bordered table-sm mt-2" style="font-size: 0.85rem"><thead><tr class="table-light">${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map((_, i) => `<td>${esc(r[i] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
        }
        default:
            if (!v) return `<div class="doc-field-val ${f.type === 'textarea' ? 'doc-long' : ''} ${blank ? '' : 'doc-empty'}">${blank ? '' : '—'}</div>`;
            return `<div class="doc-field-val ${f.type === 'textarea' ? 'doc-long' : ''}">${esc(f.type === 'date' ? fmtDate(v) : v)}</div>`;
    }
}

function buildDocumentHtml(t, vals, isEdit, blank = false) {
    const activeLogo = t.logo || S.logo; 
    const logoStr = activeLogo ? `<img src="${esc(activeLogo)}" alt="Logotipo">` : `<h3>${esc(S.hosp)}</h3>`;
    let html = `
    <div class="doc-wrapper">
        <div class="doc-header">
            <div class="logo-area">${logoStr}</div>
            <div class="title-area">${esc(t.title)}</div>
            <div class="meta-area">
                <div class="meta-row"><strong>CÓDIGO:</strong> ${esc(t.code)}</div>
                <div class="meta-row"><strong>REVISÃO:</strong> ${esc(t.version)}</div>
                <div class="meta-row"><strong>SETOR:</strong> ${esc(t.sector)}</div>
                <div class="meta-row"><strong>VIGÊNCIA:</strong> ${esc(fmtDate(t.validity) || "—")}</div>
            </div>
        </div>
        ${t.objective ? `<div class="doc-objective"><strong>Objetivo:</strong> ${esc(t.objective)}</div>` : ""}
        <div class="doc-body">`;

    t.fields.forEach(f => {
        const v = vals[f.id] || "";
        if (f.type === "section") { html += `<h4 class="doc-section">${esc(f.label)}</h4>`; return; }

        const full = ["textarea", "list", "table"].includes(f.type);
        html += `<div class="doc-field${full ? ' full' : ''}${f.type === 'sign' ? ' is-sign' : ''}"><span class="doc-field-label">${esc(f.label)}${f.req ? ' <span class="text-danger">*</span>' : ''}</span>`;

        const safeOpts = f.opts || "";
        if (isEdit) {
            if (f.type === "textarea" || f.type === "list") {
                html += `<textarea class="form-control form-control-sm" onchange="VALS['${f.id}']=this.value">${esc(v)}</textarea>`;
            } else if (f.type === "select") {
                html += `<select class="form-select form-select-sm" onchange="VALS['${f.id}']=this.value"><option value="">Selecione...</option>${safeOpts.split(",").map(x => x.trim()).filter(Boolean).map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join("")}</select>`;
            } else if (f.type === "check") {
                html += `<select class="form-select form-select-sm" onchange="VALS['${f.id}']=this.value"><option value="Não" ${v === 'Não' ? 'selected' : ''}>Não</option><option value="Sim" ${v === 'Sim' ? 'selected' : ''}>Sim</option></select>`;
            } else if (f.type === "table") {
                // Tabela em edição
                const cols = safeOpts.split(",").map(c => c.trim()).filter(Boolean);
                if (!cols.length) cols.push("Coluna 1");
                let rows = v ? v.split("\n").map(r => r.split("|").map(c => c.trim())) : [cols.map(() => "")];
                
                html += `<div class="table-responsive border rounded p-2 mt-2 bg-light"><table class="table table-sm align-middle mb-2"><thead><tr>`;
                cols.forEach(c => html += `<th><small>${esc(c)}</small></th>`);
                html += `<th style="width: 40px"></th></tr></thead><tbody id="tbody_${f.id}">`;
                
                rows.forEach((r) => {
                    html += `<tr>`;
                    cols.forEach((_, cIdx) => {
                        html += `<td><input type="text" class="form-control form-control-sm" value="${esc(r[cIdx] || "")}" oninput="updateDynamicTable('${f.id}')"></td>`;
                    });
                    html += `<td><button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="removeRow(this, '${f.id}')"><i class="fa-solid fa-xmark"></i></button></td></tr>`;
                });
                
                html += `</tbody></table><button type="button" class="btn btn-sm btn-secondary" onclick="addRow('${f.id}', ${cols.length})"><i class="fa-solid fa-plus me-1"></i>Linha</button></div>`;
            } else {
                html += `<input type="${f.type === 'sign' ? 'text' : f.type}" class="form-control form-control-sm" placeholder="${f.type === 'sign' ? 'Ex: Dr. Nome Sobrenome - CRM 00000' : ''}" value="${esc(v)}" onchange="VALS['${f.id}']=this.value">`;
            }
        } else {
            html += renderValueHtml(f, v, blank);
        }
        html += `</div>`;
    });

    html += `</div>
        <div class="doc-footer">
            <span><strong>${esc(t.code)}</strong> — Rev. ${esc(t.version)}</span>
            <span>Proprietário: ${esc(t.owner || t.sector)}</span>
            <span>Documento controlado SIPAD</span>
        </div>
    </div>`;
    return html;
}

// Funções da Tabela dinâmica
function updateDynamicTable(fieldId) {
    const tbody = document.getElementById(`tbody_${fieldId}`);
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll("tr"));
    VALS[fieldId] = rows.map(tr => Array.from(tr.querySelectorAll("input")).map(i => i.value.trim().replace(/\|/g, "")).join(" | ")).join("\n");
}
window.updateDynamicTable = updateDynamicTable;

function addRow(fieldId, colCount) {
    const tbody = document.getElementById(`tbody_${fieldId}`);
    const tr = document.createElement("tr");
    let html = "";
    for(let i=0; i<colCount; i++) html += `<td><input type="text" class="form-control form-control-sm" oninput="updateDynamicTable('${fieldId}')"></td>`;
    html += `<td><button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="removeRow(this, '${fieldId}')"><i class="fa-solid fa-xmark"></i></button></td>`;
    tr.innerHTML = html; tbody.appendChild(tr); updateDynamicTable(fieldId);
}
window.addRow = addRow;

function removeRow(btn, fieldId) { btn.closest("tr").remove(); updateDynamicTable(fieldId); }
window.removeRow = removeRow;

// Lógica segura de Impressão
function printHtml(bodyHtml, titleStr) {
    const old = document.getElementById("print-frame"); if (old) old.remove();
    const fr = document.createElement("iframe"); fr.id = "print-frame"; fr.setAttribute("aria-hidden", "true"); fr.style.cssText = "position:absolute; width:0; height:0; border:0; top:-9999px;";
    document.body.appendChild(fr);
    const win = fr.contentWindow; const doc = win.document;
    const css = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(n => n.outerHTML).join("");
    const cleanTitle = titleStr.replace(/[\/\\]/g, '-');

    doc.open();
    doc.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${cleanTitle}</title>${css}<style>html, body { background: #fff !important; margin: 0; padding: 0; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 15mm; size: A4 portrait; }</style></head><body>${bodyHtml}</body></html>`);
    doc.close();

    const doPrint = () => { win.focus(); try { win.print(); } catch (e) {} setTimeout(() => { if(document.getElementById("print-frame")) fr.remove(); }, 60000); };
    win.addEventListener("afterprint", () => setTimeout(() => fr.remove(), 1000));
    const p = [];
    Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).forEach(l => p.push(new Promise(r => { l.onload = r; l.onerror = r; })));
    Array.from(doc.querySelectorAll('img')).forEach(img => { if(!img.complete) p.push(new Promise(r => { img.onload = r; img.onerror = r; })); });
    if(doc.fonts && doc.fonts.ready) p.push(doc.fonts.ready);
    Promise.race([Promise.all(p), new Promise(r => setTimeout(r, 3000))]).then(() => setTimeout(doPrint, 150));
}

const printNote = (txt) => `<div class="mt-3 text-center" style="font-size: 10px; color: #6c757d; font-family: monospace;">${esc(txt)} — Impresso por ${esc(getMe().name)} em ${new Date().toLocaleString("pt-BR")}</div>`;
function printRecord(id) { const r = S.records.find(x => x.id === id); if (r) printHtml(buildDocumentHtml(r.snap, r.vals, false) + printNote(`Registro oficial gerado em ${r.date} por ${r.author}`), `${r.snap.code} - ${r.snap.title}`); }
function printTemplate(id, useVals = false) { const t = getTemplate(id); if (t) { const filled = useVals && Object.values(VALS).some(Boolean); printHtml(buildDocumentHtml(t, filled ? VALS : {}, false, !filled) + printNote(filled ? "Rascunho não arquivado" : "Formulário em branco"), `${t.code} - ${t.title}`); } }

function startFill(id) { S.sel = id; VALS = {}; S.view = "fill"; render(); }
function viewFill() {
    const t = getTemplate(S.sel);
    return `
    <div class="no-print d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 class="fw-bold mb-0">Preenchimento Oficial</h3>
        <div class="gap-2 d-flex">
            ${t.printable !== false ? `<button class="btn btn-outline-secondary bg-body" onclick="printTemplate('${t.id}', true)"><i class="fa-solid fa-print me-2"></i>Imprimir/PDF</button>` : ''}
            <button class="btn btn-outline-secondary bg-body" onclick="S.view='lib'; render()">Cancelar</button>
            <button class="btn btn-primary shadow-sm" onclick="saveRecord()"><i class="fa-solid fa-check-double me-2"></i>Assinar & Salvar</button>
        </div>
    </div>
    ${t.protocol ? `<div class="no-print alert alert-info border-start border-info border-4 shadow-sm mb-4"><h6 class="alert-heading fw-bold"><i class="fa-solid fa-circle-info me-2"></i>Instruções Normativas</h6><div class="small text-break" style="white-space:pre-wrap;">${esc(t.protocol)}</div></div>` : ''}
    <div class="screen-only">${buildDocumentHtml(t, VALS, true)}</div>`;
}
function saveRecord() {
    const t = getTemplate(S.sel);
    const missing = t.fields.filter(f => f.req && !VALS[f.id] && f.type !== "section");
    if (missing.length) { showToast("Preencha todos os campos obrigatórios (*).", "error"); return; }
    S.records.push({ id: uid(), tid: t.id, snap: JSON.parse(JSON.stringify(t)), vals: JSON.parse(JSON.stringify(VALS)), date: new Date().toLocaleString("pt-BR"), author: getMe().name });
    saveDB(); showToast("Registro salvo e arquivado com sucesso!"); S.view = "records"; render();
}

function viewRecords() {
    if (S.selRec) return viewSingleRecord(S.selRec);
    return `
    <h3 class="fw-bold mb-4">Histórico de Registros</h3>
    <div class="row g-4">
        ${S.records.slice().reverse().map(r => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column">
                        <div class="mb-2"><span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle">${esc(r.snap.sector)}</span></div>
                        <h5 class="fw-bold mb-1">${esc(r.snap.title)}</h5>
                        <p class="text-muted small mb-3">${esc(r.snap.code)}</p>
                        <div class="bg-light p-2 rounded mb-3 small border border-secondary-subtle">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted">Data:</span> <strong class="text-dark">${esc(r.date)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Autor:</span> <strong class="text-dark text-truncate ms-2">${esc(r.author)}</strong>
                            </div>
                        </div>
                        <div class="d-flex gap-2 mt-auto">
                            <button class="btn btn-sm btn-primary flex-grow-1" onclick="S.selRec='${r.id}'; render()"><i class="fa-regular fa-folder-open me-2"></i>Abrir</button>
                            ${getMe().admin ? `<button class="btn btn-sm btn-outline-danger" onclick="delRecord('${r.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join("")}
        ${!S.records.length ? '<div class="col-12"><div class="p-5 text-center border rounded border-dashed text-muted"><i class="fa-solid fa-clock-rotate-left fa-3x mb-3 opacity-50"></i><p>Nenhum formulário foi preenchido ainda.</p></div></div>' : ''}
    </div>`;
}
function viewSingleRecord(id) {
    const r = S.records.find(x => x.id === id); if (!r) { S.selRec = null; return viewRecords(); }
    return `
    <div class="no-print d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <button class="btn btn-outline-secondary bg-body" onclick="S.selRec=null; render()"><i class="fa-solid fa-arrow-left me-2"></i>Voltar à Lista</button>
        ${r.snap.printable !== false ? `<button class="btn btn-primary shadow-sm" onclick="printRecord('${r.id}')"><i class="fa-solid fa-print me-2"></i>Exportar/Imprimir</button>` : ''}
    </div>
    <div id="print-area">${buildDocumentHtml(r.snap, r.vals, false)}</div>`;
}
function delRecord(id) { if (confirm("ATENÇÃO: Deseja apagar este registro permanentemente?")) { S.records = S.records.filter(x => x.id !== id); saveDB(); render(); showToast("Registro deletado com sucesso."); } }

// --- CONFIGURAÇÕES DE ADMINISTRAÇÃO ---
function viewConfig() {
    if (!getMe().admin) return "Acesso negado.";
    setTimeout(updateRoleDropdownHTML, 50);

    return `
    <h3 class="fw-bold mb-4">Painel do Administrador</h3>
    <div class="row g-4">
        
        <div class="col-lg-5">
            <div class="card shadow-sm border-0 h-100">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-0">
                    <h5 class="text-primary fw-bold mb-0"><i class="fa-solid fa-building me-2"></i>Identidade Institucional</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label small fw-medium">Razão Social / Nome da Instituição</label>
                        <input type="text" class="form-control" value="${esc(S.hosp)}" onchange="S.hosp=this.value; saveDB()">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-medium">Logotipo dos Relatórios</label>
                        <input type="file" class="form-control form-control-sm mb-3" accept="image/*" onchange="loadLogo(this)">
                        ${S.logo ? `<div class="d-flex gap-3 align-items-center bg-light p-2 rounded border border-secondary-subtle"><img src="${esc(S.logo)}" style="max-height:60px; object-fit:contain; background:#fff; padding:4px;" class="rounded border"><button class="btn btn-sm btn-outline-danger ms-auto border-0" onclick="S.logo=''; saveDB(); render()"><i class="fa-solid fa-trash me-2"></i>Remover</button></div>` : '<div class="alert alert-secondary small mb-0 py-2 border-0"><i class="fa-solid fa-circle-info me-2"></i>Sem logo. O nome em texto será utilizado.</div>'}
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-7">
            <div class="card shadow-sm border-0 h-100">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                    <h5 class="text-primary fw-bold mb-0"><i class="fa-solid fa-users-gear me-2"></i>Credenciais & Acessos</h5>
                </div>
                <div class="card-body">
                    
                    <div class="bg-light p-3 rounded border border-secondary-subtle mb-4">
                        <h6 class="fw-bold mb-3 small text-uppercase text-secondary">Emitir Nova Credencial</h6>
                        <div class="row g-2">
                            <div class="col-sm-6"><input type="text" id="nu_n" class="form-control form-control-sm" placeholder="Nome Completo"></div>
                            <div class="col-sm-6"><input type="text" id="nu_l" class="form-control form-control-sm" placeholder="Login de Usuário"></div>
                            <div class="col-sm-6"><select id="nu_s" class="form-select form-select-sm" onchange="updateRoleDropdownHTML()">${SECTORS.map(s => `<option>${s}</option>`).join("")}</select></div>
                            <div class="col-sm-6"><select id="nu_r" class="form-select form-select-sm"></select></div>
                            <div class="col-sm-6"><input type="password" id="nu_p" class="form-control form-control-sm" placeholder="Senha inicial"></div>
                            <div class="col-sm-6 d-flex align-items-center">
                                <div class="form-check m-0">
                                    <input class="form-check-input" type="checkbox" id="nu_a">
                                    <label class="form-check-label small fw-medium text-danger" for="nu_a">Admin Global</label>
                                </div>
                            </div>
                            <div class="col-12 mt-3">
                                <button class="btn btn-sm btn-primary w-100" onclick="addUser()"><i class="fa-solid fa-user-plus me-2"></i>Cadastrar Usuário</button>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table table-hover table-sm align-middle small mb-0">
                            <thead class="table-light"><tr><th>Colaborador</th><th>Credencial</th><th>Setor</th><th>Privilégio</th><th></th></tr></thead>
                            <tbody>
                                ${S.users.map(u => `
                                    <tr>
                                        <td class="fw-medium">${esc(u.name)}</td>
                                        <td><code class="bg-body-secondary px-1 rounded text-body">${esc(u.login)}</code></td>
                                        <td>${esc(u.sector)}</td>
                                        <td>${u.admin ? '<span class="badge bg-danger">Admin</span>' : (u.isManager ? '<span class="badge bg-success">Gestor</span>' : '<span class="badge bg-secondary">Membro</span>')}</td>
                                        <td class="text-end">${u.id !== S.me ? `<button class="btn btn-sm btn-outline-danger border-0" onclick="delUser('${u.id}')" title="Revogar"><i class="fa-solid fa-user-slash"></i></button>` : '<i class="fa-solid fa-user-check text-success opacity-50 px-2"></i>'}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function toggleMenu(force) { document.body.classList.toggle("menu-open", force); }
function closeMenu() { document.body.classList.remove("menu-open"); }

function updateRoleDropdownHTML() {
    const selSec = document.getElementById("nu_s");
    const selRole = document.getElementById("nu_r");
    if(!selSec || !selRole) return;
    const roles = getRolesFor(selSec.value);
    selRole.innerHTML = roles.map(r => `<option value="${esc(r.r)}" data-m="${r.m}">${esc(r.r)} ${r.m ? '(Perfil Gestor)' : '(Operacional)'}</option>`).join("");
}

function loadLogo(inp) { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { S.logo = r.result; saveDB(); render(); showToast("Identidade visual atualizada."); }; r.readAsDataURL(f); }

async function addUser() {
    const n = document.getElementById("nu_n").value.trim();
    const l = document.getElementById("nu_l").value.trim().toLowerCase();
    const p = document.getElementById("nu_p").value;
    const s = document.getElementById("nu_s").value;
    
    const selRole = document.getElementById("nu_r");
    const role = selRole.value;
    const isManager = selRole.options[selRole.selectedIndex].getAttribute("data-m") === "true";
    const admin = document.getElementById("nu_a").checked;

    if (!n || !l || p.length < 4) { showToast("Erro: Preencha nome, login e senha (mínimo 4 char).", "error"); return; }
    if (S.users.some(u => u.login === l)) { showToast("Conflito: Este login já está sendo utilizado.", "error"); return; }

    S.users.push({ id: uid(), name: n, login: l, hash: await hashPass(p), sector: s, role: role, isManager: isManager, admin: admin });
    saveDB(); render(); showToast("Credencial ativa.");
}
function delUser(id) { if (confirm("Revogar o acesso deste colaborador permanentemente?")) { S.users = S.users.filter(u => u.id !== id); saveDB(); render(); showToast("Acesso revogado."); } }

// Inicialização ao carregar a página
// (lembre-se de linkar também o bootstrap.bundle.min.js no HTML para os dropdowns funcionarem)
window.onload = () => {
    boot();
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
    window.addEventListener("resize", () => { if (window.innerWidth >= 992) closeMenu(); });
};