if not exists(select 1 from DOCUMENTOS_ASSINADOS_TIPOS with(nolock) where dt_id=1 ) begin
	insert into DOCUMENTOS_ASSINADOS_TIPOS
	select '1','Solicitação de Exames','','S','S'
end
GO
if not exists(select 1 from DOCUMENTOS_ASSINADOS_TIPOS with(nolock) where dt_id=2 ) begin
	insert into DOCUMENTOS_ASSINADOS_TIPOS
	select '2','Receituário Livre','','S','S'
end
GO
if not exists(select 1 from DOCUMENTOS_ASSINADOS_TIPOS with(nolock) where dt_id=3 ) begin
	insert into DOCUMENTOS_ASSINADOS_TIPOS
	select '3','Anamnese/Evolução/Relatórios/Imagens/Áudios...','','S','S'
end
GO
if not exists(select 1 from DOCUMENTOS_ASSINADOS_TIPOS with(nolock) where dt_id=4 ) begin
	insert into DOCUMENTOS_ASSINADOS_TIPOS
	select '4','Prescrição','','S','S'
end
GO
if not exists(select 1 from DOCUMENTOS_ASSINADOS_TIPOS with(nolock) where dt_id=5 ) begin
	insert into DOCUMENTOS_ASSINADOS_TIPOS
	select '5','Prescrição Dietética','','S','S'
end
GO
if not exists(select 1 from DOCUMENTOS_ASSINADOS_TIPOS with(nolock) where dt_id=6 ) begin
	insert into DOCUMENTOS_ASSINADOS_TIPOS
	select '6','Antiangiogênico','','S','S'
end
GO
if not exists(select 1 from DOCUMENTOS_ASSINADOS_TIPOS with(nolock) where dt_id=7 ) begin
	insert into DOCUMENTOS_ASSINADOS_TIPOS
	select '7','Audiometria','','S','S'
end
GO
if not exists(select 1 from DOCUMENTOS_ASSINADOS_TIPOS with(nolock) where dt_id=8 ) begin
	insert into DOCUMENTOS_ASSINADOS_TIPOS
	select '8','Anamnese','','S','S'
end
GO