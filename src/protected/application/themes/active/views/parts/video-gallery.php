<?php
$videos = $entity->getMetaLists('videos');

$template = "<li id='video-{{id}}'>
                <a class='js-metalist-item-display' href='#video' data-videolink='{{value}}'>
                    <img src='{$assetURL}/img/spinner_192.gif' class='thumbnail_med_wide'/>
                    <h1 class='title'>{{title}}</h1>
                </a>
                <div class='botoes-de-edicao'>
                    <a class='js-open-dialog editar hltip'
                        data-dialog='#dialog-videogallery'
                        data-dialog-callback='MapasCulturais.MetaListUpdateDialog'
                        data-response-target='#video-{{id}}'
                        data-metalist-action='edit'
                        href='#' title='Editar'></a>
                    <a class='icone icon_close_alt js-metalist-item-delete hltip js-remove-item' data-href='{{deleteUrl}}' data-target='#video-{{id}}' data-confirm-message='Excluir este vídeo?' title='Excluir'></a>
                </div>
            </li>";
?>
<?php if (is_editable() || $videos): ?>
    <h3>Vídeos</h3>
    <a name="video"></a>
    <div id="video-player" class="video">
        <iframe id="video_display" width="100%" height="100%" src="" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
    </div>
    <ul class="clearfix js-videogallery">
        <?php if($videos): foreach($videos as $video): ?>
            <li id="video-<?php echo $video->id ?>" class="js-metalist-item-id-<?php echo $video->id ?>">
                <a class="js-metalist-item-display" data-videolink="<?php echo $video->value;?>" title="<?php echo $video->title;?>">
                    <img src="<?php echo $assetURL?>/img/spinner_192.gif" alt="" class="thumbnail_med_wide"/>
                    <h1 class="title"><?php echo $video->title;?></h1>
                </a>
                <?php if(is_editable()): ?>
                    <div class="botoes-de-edicao">
                        <a class="js-open-dialog editar hltip"
                           data-dialog="#dialog-videogallery"
                           data-dialog-callback="MapasCulturais.MetaListUpdateDialog"
                           data-response-target="ul.js-videogallery li.js-metalist-item-id-<?php echo $video->id ?>"
                           data-metalist-action="edit"
                           data-item='<?php echo json_encode($video);?>'
                           href="#" title='Editar'></a>
                           <a class='icone icon_close_alt js-metalist-item-delete hltip js-remove-item' data-href='<?php echo $video->deleteUrl ?>' data-target="#video-<?php echo $video->id ?>" data-confirm-messagem="Excluir este vídeo?" title='Excluir'></a>
                    </div>
                <?php endif; ?>
            </li>
        <?php endforeach; endif;?>
    </ul>
<?php endif; ?>

<div id="dialog-videogallery" class="js-dialog" title="Editar Vídeo"
     data-action-url="<?php echo $this->controller->createUrl('metalist', array('id' => $entity->id)) ?>"
     data-response-template="<?php echo $template; ?>"
     data-metalist-group="videos"
     data-metalist-title-label="Nome" data-metalist-value-label="Endereço" data-metalist-description-label="Descrição">
    <?php if($this->controller->action == 'create'): ?>
        <span class="js-dialog-disabled" data-message="Primeiro Salve"></span>
    <?php else: $app->view->part('parts/metalist-form.template.html'); endif; ?>
</div>
<?php if(is_editable()): ?>
    <p class="p-dos-botoes">
        <a class="botao adicionar js-open-dialog" href="#"
           data-dialog-title="Adicionar Vídeo"
           data-dialog="#dialog-videogallery"
           data-dialog-callback="MapasCulturais.MetaListUpdateDialog"
           data-response-target="ul.js-videogallery"
           data-metalist-action="insert"
           data-response-template="<?php echo $template; ?>"
                        >adicionar vídeo</a>
    </p>
<?php endif; ?>