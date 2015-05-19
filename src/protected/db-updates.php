<?php
namespace MapasCulturais;

$app = App::i();
$em = $app->em;
$conn = $em->getConnection();


return [
    'remove circular references' => function() use ($conn) {
        $conn->executeQuery("UPDATE agent SET parent_id = null WHERE id = parent_id");

        $conn->executeQuery("UPDATE agent SET parent_id = null WHERE id IN (SELECT profile_id FROM usr)");
    }
];
/*
>>>>>>> stable

return array(
    'alter table user add column profile_id' => function() use ($app, $conn){
        if($conn->fetchAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'usr' AND column_name = 'profile_id'")){
            return true;
        }


        echo "adicionando coluna profile_id à tabela de usuários\n";

        $conn->executeQuery('ALTER TABLE usr ADD COLUMN profile_id INTEGER;');

        echo "criando user_profile_fk\n";
        $conn->executeQuery('ALTER TABLE ONLY usr ADD CONSTRAINT user_profile_fk FOREIGN KEY (profile_id) REFERENCES agent(id);');

        $agents = $conn->fetchAll("SELECT id, user_id FROM agent WHERE is_user_profile = TRUE");

        foreach($agents as $agent){
            echo "setando o user profile do usuário {$agent['user_id']} como o agente de id {$agent['id']}\n";
            $conn->executeQuery('UPDATE usr SET profile_id = ' . $agent['id'] . ' WHERE id = ' . $agent['user_id']);
        }

        echo "removendo a coluna is_user_profile da tabela agent\n";
        $conn->executeQuery('ALTER TABLE agent DROP COLUMN is_user_profile;');
    },

    'create table registration ' => function() use ($conn){

        if($conn->fetchAll("SELECT tablename from pg_catalog.pg_tables WHERE tablename = 'registration' AND schemaname = 'public'")){
            return true;
        }

        echo "criando tabela registration\n";

        $conn->executeQuery("
            CREATE TABLE registration (
                id integer NOT NULL,
                project_id integer NOT NULL,
                category varchar(255),
                agent_id integer NOT NULL,
                create_timestamp timestamp without time zone DEFAULT now() NOT NULL,
                sent_timestamp timestamp without time zone,
                status integer NOT NULL
            );");

        echo "criando sequencia registration_id_seq\n";
        $conn->executeQuery("
            CREATE SEQUENCE registration_id_seq
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;");

        echo "setando valor default do id\n";
        $conn->executeQuery("ALTER TABLE ONLY registration ALTER COLUMN id SET DEFAULT nextval('registration_id_seq'::regclass);");

        echo "criando chave primária\n";
        $conn->executeQuery("ALTER TABLE ONLY registration
                                ADD CONSTRAINT registration_pkey PRIMARY KEY (id);");


        echo "criando agent FK\n";
        $conn->executeQuery("ALTER TABLE ONLY registration
                                ADD CONSTRAINT registration_agent_id_fk FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE SET NULL;");


        echo "criando project FK\n";
        $conn->executeQuery("ALTER TABLE ONLY registration
                                ADD CONSTRAINT registration_project_fk FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE;");


    },

    'create table registration_meta' => function() use($conn){
        if($conn->fetchAll("SELECT tablename from pg_catalog.pg_tables WHERE tablename = 'registration_meta' AND schemaname = 'public'")){
            return true;
        }

        echo "create table registration_meta\n";
        $conn->executeQuery("CREATE TABLE registration_meta (
                                object_id integer NOT NULL,
                                key character varying(32) NOT NULL,
                                value text
                            );");

        echo "create registration meta primary key\n";
        $conn->executeQuery("ALTER TABLE ONLY registration_meta
                                ADD CONSTRAINT registration_meta_pkey PRIMARY KEY (object_id, key);");

        echo "create registration_meta key value index\n";
        $conn->executeQuery("CREATE INDEX registration_meta_key_value_index ON registration_meta USING btree (key, value);");
    },

    'create table registration' => function() use ($conn){
        if($conn->fetchAll("SELECT tablename from pg_catalog.pg_tables WHERE tablename = 'registration_file_configuration' AND schemaname = 'public'")){
            return true;
        }

        echo "criando tabela registration\n";

        echo "create table registration_file_configuration\n";
        $conn->executeQuery("CREATE TABLE registration_file_configuration (
                                id SERIAL PRIMARY KEY,
                                project_id integer NOT NULL,
                                title character varying(255) NOT NULL,
                                description text,
                                required boolean NOT NULL DEFAULT false
                            );");

        echo "criando registration_file_configuration to project FK\n";
        $conn->executeQuery("ALTER TABLE ONLY registration_file_configuration
                                ADD CONSTRAINT registration_meta_project_fk FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE SET NULL;");
    },

    'alter table registration add column registration_categories' => function() use($conn){
        if($conn->fetchAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'project' AND column_name = 'registration_categories'")){
            return true;
        }

        echo "adicionando coluna registration_categories\n";
        $conn->executeQuery('ALTER TABLE project ADD COLUMN registration_categories text;');
    },

    'alter table project add columns use_registrations AND publihed_registrations' => function() use($conn){
        if($conn->fetchAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'project' AND column_name = 'use_registrations'")){
            return true;
        }

        echo "adicionando coluna use_registrations\n";
        $conn->executeQuery("ALTER TABLE project ADD COLUMN use_registrations BOOLEAN NOT NULL DEFAULT FALSE;");

        echo "adicionando coluna published_registrations\n";
        $conn->executeQuery("ALTER TABLE project ADD COLUMN published_registrations BOOLEAN NOT NULL DEFAULT FALSE;");

        echo "removendo coluna public_registration\n";
        $conn->executeQuery("ALTER TABLE project DROP COLUMN public_registration;");
    },

    'create or replace function random_id_generator' => function() use($conn){
        $conn->executeQuery('
            CREATE OR REPLACE FUNCTION random_id_generator(table_name character varying, initial_range bigint) RETURNS bigint
                LANGUAGE plpgsql
                AS $$DECLARE
              rand_int INTEGER;
              count INTEGER := 1;
              statement TEXT;
            BEGIN
              WHILE count > 0 LOOP
                initial_range := initial_range * 10;

                rand_int := (RANDOM() * initial_range)::BIGINT + initial_range / 10;

                statement := CONCAT(\'SELECT count(id) FROM \', table_name, \' WHERE id = \', rand_int);

                EXECUTE statement;
                IF NOT FOUND THEN
                  count := 0;
                END IF;

              END LOOP;
              RETURN rand_int;
            END;
            $$;');
    },

    'alter table registration add columns agents_data' => function() use($conn){
        if($conn->fetchAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'registration' AND column_name = 'agents_data'")){
            return true;
        }

        echo "adicionando coluna agents_data\n";
        $conn->executeQuery("ALTER TABLE registration ADD COLUMN agents_data TEXT;");

    },

    'import new openid data' => function () use($conn){

        // this must be run on the open id server
        // sudo -u postgres psql -d "openid-staging" -c "COPY (select u.username, u.email, p.openid from auth_user u, openid_provider_openid p where p.user_id = u.id) TO STDOUT" > /tmp/openid-new-data.tmp
        $file = '/tmp/openid-new-data.tmp';
        if(!file_exists($file)){
            return false;
        }
        $data = file_get_contents($file);


        $excecoes_data = "http://id.spcultura.prefeitura.sp.gov.br/users/volusiano/	comunicavolusiano@gmail.com	cybelle.a.oliveira@gmail.com
http://id.spcultura.prefeitura.sp.gov.br/users/Parque/	parquechacaradojoquei@hotmail.com	parquechacaradojoquei@gmail.com
http://id.spcultura.prefeitura.sp.gov.br/users/rosanaaraujo/	rosanadole@yahoo.com	rosanadole@yahoo.com.br
http://id.spcultura.prefeitura.sp.gov.br/users/tonynevesneves/	tonyneves@yahoo.com.br	tonyneves2003@yahoo.com.br";
        $excecoes = explode("\n", $excecoes_data);
        foreach($excecoes as $ex){
            $e = explode("\t", $ex);
            list($auid, $old_email, $new_email) = $e;

            $sql = "UPDATE usr SET email='$new_email' WHERE auth_uid = '$auid' AND email = '$old_email'\n";
            echo $sql;
            $conn->executeQuery($sql);
        }


        $users = explode("\n",$data);
        foreach($users as $u){
            if(!$u)
                continue;

            $d = explode("\t", $u);
            list($username, $email, $openid) = $d;
            if(count($d) != 3)
                var_dump($d);

            $auid = App::i()->config['auth.config']['login_url'] . str_replace('/openid/','',$openid) . '/';
            $sql = "UPDATE usr SET auth_uid = '$auid' WHERE email = '$email'\n";
            echo $sql;
            $conn->executeQuery($sql);
        }
        return true;
    },

    'replace "relacioanr" in notification messages asd' => function() use($conn) {
        $count = $conn->fetchAssoc("SELECT count(*) AS total FROM notification WHERE message LIKE '%relacioanr%'");
        if($count['total'] > 0){
            echo 'Atualizando ' . $count['total'] . ' notificações com o erro de grafia "relacioanr"'."\n";
            $sql = "UPDATE notification SET message = replace(message, 'relacioanr', 'relacionar') WHERE message LIKE '%relacioanr%'";
            echo $sql;
            $conn->executeQuery($sql);
        }
        return true;
    },

    'fix select values' => function() use($conn){
        $conn->executeQuery("
            UPDATE
                agent_meta
            SET
                value = ''
            WHERE
                (key = 'raca' AND value='Selecione a raça/cor se for pessoa física') OR
                (key = 'genero' AND value='Selecione o gênero se for pessoa física')
                ");

        $conn->executeQuery("
            UPDATE
                space_meta
            SET
                value = ''
            WHERE
                (key = 'acessibilidade' AND value='Acessibilidade')
                ");

        $conn->executeQuery("
            UPDATE
                event_meta
            SET
                value = ''
            WHERE
                (key = 'classificacaoEtaria' AND value='Informe a classificação etária do evento') OR
                (key = 'traducaoLibras' AND value='Tradução para LIBRAS') OR
                (key = 'descricaoSonora' AND value='Áudio descrição')
                ");
        return true;
    },

    'agent_meta location from precise/approximate to public/private' => function() use($conn) {
        echo 'Inserindo em agent_meta "localização" = "Pública" onde "precisao" = "Precisa"'."\n";
        $conn->executeQuery("
            INSERT INTO agent_meta (object_id, key, value)
            SELECT object_id, 'localizacao', 'Pública' FROM agent_meta WHERE key = 'precisao' AND value = 'Precisa'
        ");
        echo 'Inserindo em agent_meta "localização" = "Privada" onde "precisao" = "Aproximada"'."\n";
        $conn->executeQuery("
            INSERT INTO agent_meta (object_id, key, value)
            SELECT object_id, 'localizacao', 'Privada' FROM agent_meta WHERE key = 'precisao' AND value = 'Aproximada'
        ");
        echo 'Inserindo em agent_meta "localização" = "Privada" para agentes com _geo_location mas sem precisão definida'."\n";
        $conn->executeQuery("
            INSERT INTO agent_meta (object_id, key, value)
            SELECT id, 'localizacao', 'Privada' FROM agent
            WHERE _geo_location IS NOT NULL AND _geo_location != ST_Transform(ST_GeomFromText('POINT(0 0)',4326),4326)
            AND id NOT IN (SELECT DISTINCT (object_id) FROM agent_meta WHERE key = 'precisao')
        ");
        return true;
    },

    'migrate agent privateLocation from agent_meta to entity' => function() use($conn) {
         if($conn->fetchAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'agent' AND column_name = 'public_location'")){
            return true;
        }
        echo "Adicionando coluna public_location\n";
        $conn->executeQuery("ALTER TABLE agent ADD COLUMN public_location BOOLEAN DEFAULT NULL;");

        echo 'Migrando dados do metadado localizacao para public_location';
        $conn->executeQuery("
            UPDATE agent SET public_location = TRUE
            WHERE id IN (SELECT object_id FROM agent_meta WHERE key = 'localizacao' AND value = 'Pública')
        ");
        $conn->executeQuery("
            UPDATE agent SET public_location = FALSE
            WHERE id IN (SELECT object_id FROM agent_meta WHERE key = 'localizacao' AND value = 'Privada')
        ");
        return true;
    },

    'regenerate sent registration zip files' => function() use($app){
        $registrations = $app->repo('Registration')->findAll();
        foreach($registrations as $registration){
            if($registration->status > 0 && $registration->files){
                $app->storage->createZipOfEntityFiles($registration, $fileName = $registration->number . ' - ' . uniqid() . '.zip');
            }
        }
        return true;
    },

    'alter table file add column parent_id' => function() use($conn) {
        echo "adicionando coluna parent_id a tabela file\n";
        $conn->executeQuery("ALTER TABLE file ADD COLUMN parent_id INTEGER DEFAULT NULL;");

        echo "adicionando FK file_file_fk";
        $conn->executeQuery("
        ALTER TABLE ONLY file
            ADD CONSTRAINT file_file_fk FOREIGN KEY (parent_id) REFERENCES file(id);");

        echo "deletando arquivos órfãos\n";
        $conn->executeQuery("DELETE FROM file WHERE object_type = 'MapasCulturais\Entities\File' AND object_id NOT IN (SELECT id FROM file WHERE object_type != 'MapasCulturais\Entities\File')");

        echo "atualizando o parent_id dos files que têm pai\n";
        $conn->executeQuery("UPDATE file SET parent_id = object_id WHERE object_type = 'MapasCulturais\Entities\File'");

        echo "atualizando o owner dos files que têm pai\n";
        $conn->executeQuery("
        UPDATE
            file AS f
        SET
            grp = CONCAT('img:', f.grp),
            object_type   = f2.object_type,
            object_id     = f2.object_id
        FROM (
            SELECT * FROM file
        ) as f2
        WHERE
            f.parent_id = f2.id");

    },

    'alter table term_relation add column id' => function() use($conn){
        if($conn->fetchAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'term_relation' AND column_name = 'id'")){
            return true;
        }

        echo "\nremovendo PK antiga da tabela term_relation";
        $conn->executeQuery("ALTER TABLE ONLY term_relation
                                DROP CONSTRAINT term_relation_pk;");

        echo "\nadicionando coluna id na tabela term_relation";
        $conn->executeQuery("ALTER TABLE term_relation ADD COLUMN id SERIAL;");

        echo "\ncriando nova PK na tabela term_relation";
        $conn->executeQuery("ALTER TABLE ONLY term_relation
                                ADD CONSTRAINT term_relation_pk PRIMARY KEY (id);");

        echo "\ncriando indice owne_index na tabela term_relation";
        $conn->executeQuery("CREATE INDEX owner_index ON term_relation USING btree (object_type, object_id)");

    },

    'create file and term indexes' => function () use($conn){
        echo "\n'CREATE UNIQUE INDEX taxonomy_term_unique ON term USING btree (taxonomy, term)'";
        $conn->executeQuery('CREATE UNIQUE INDEX taxonomy_term_unique ON term USING btree (taxonomy, term)');

        echo "\nCREATE INDEX file_owner_grp_index ON file USING btree (object_type, object_id, grp)";
        $conn->executeQuery('CREATE INDEX file_owner_grp_index ON file USING btree (object_type, object_id, grp)');
    },

    'alter metadata table add column id' => function() use($conn) {

        foreach(['agent', 'event', 'space', 'project', 'registration'] as $entity){
            $table = $entity . "_meta";

            echo "\nremovendo PK antiga da tabela {$table}";
            if($entity === 'registration'){
                $conn->executeQuery("ALTER TABLE ONLY {$table}
                                    DROP CONSTRAINT {$table}_pkey;");
            }else{
                $conn->executeQuery("ALTER TABLE ONLY {$table}
                                    DROP CONSTRAINT {$table}_pk;");
            }

            echo "\nadicionando coluna id na tabela {$table}";
            $conn->executeQuery("ALTER TABLE {$table} ADD COLUMN id SERIAL;");

            echo "\ncriando nova PK na tabela {$table}";
            $conn->executeQuery("ALTER TABLE ONLY {$table}
                                    ADD CONSTRAINT {$table}_pk PRIMARY KEY (id);");

            echo "\ncriando indice owner_key_index na tabela {$table}";
            $conn->executeQuery("CREATE INDEX {$table}_owner_key_index ON {$table} USING btree (object_id, key)");

            echo "\ncriando indice owner_key_value_index na tabela {$table}";
            $conn->executeQuery("CREATE INDEX {$table}_owner_key_value_index ON {$table} USING btree (object_id, key, value)");
        }
    }

);
