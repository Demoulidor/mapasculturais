<?php

namespace MapasCulturais\Entities;

use Doctrine\ORM\Mapping as ORM;
use MapasCulturais\App;

/**
 * AgentRelation
 *
 *
 * @property-read int $id The Id of the relation.
 *
 * @todo http://thoughtsofthree.com/2011/04/defining-discriminator-maps-at-child-level-in-doctrine-2-0/
 *
 * @ORM\Table(name="agent_relation")
 * @ORM\Entity
 * @ORM\InheritanceType("SINGLE_TABLE")
 * @ORM\DiscriminatorColumn(name="object_type", type="string")
 * @ORM\DiscriminatorMap({
        "MapasCulturais\Entities\Project"   = "\MapasCulturais\Entities\AgentRelations\Project",
        "MapasCulturais\Entities\Event"     = "\MapasCulturais\Entities\AgentRelations\Event",
        "MapasCulturais\Entities\Agent"     = "\MapasCulturais\Entities\AgentRelations\Agent",
        "MapasCulturais\Entities\Space"     = "\MapasCulturais\Entities\AgentRelations\Space"
   })
 */
abstract class AgentRelation extends \MapasCulturais\Entity
{
    use \MapasCulturais\Traits\EntityMetadata,
        \MapasCulturais\Traits\EntityFiles;


    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer", nullable=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="SEQUENCE")
     * @ORM\SequenceGenerator(sequenceName="agent_relation_id_seq", allocationSize=1, initialValue=1)
     */
    protected $id;

    /**
     * @var integer
     *
     * @ORM\Column(name="object_id", type="integer", nullable=false)
     */
    protected $objectId;

    /**
     * @var string
     *
     * @ORM\Column(name="type", type="string", length=64, nullable=true)
     */
    protected $group;

    /**
     * @var boolean
     *
     * @ORM\Column(name="has_control", type="boolean", nullable=false)
     */
    protected $hasControl = false;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="create_timestamp", type="datetime", nullable=true)
     */
    protected $createTimestamp;

    /**
     * @var integer
     *
     * @ORM\Column(name="status", type="smallint", nullable=true)
     */
    protected $status = self::STATUS_ENABLED;

    /**
     * @var \MapasCulturais\Entities\Agent
     *
     * @ORM\ManyToOne(targetEntity="MapasCulturais\Entities\Agent", cascade="all", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="agent_id", referencedColumnName="id")
     * })
     */
    protected $agent;

    function jsonSerialize() {
        $result = parent::jsonSerialize();
        $result['ownerType'] = $this->owner->className;
        $result['ownerId'] = $this->owner->id;
        $result['agentId'] = $this->agent->id;
        unset($result['owner']);
        unset($result['agent']);
        unset($result['objectId']);
        return $result;
    }

    protected function canUserRemove($user = null){
        if($this->hasControl)
            return $this->owner->canUser('removeAgentRelationWithControl', $user);
        else
            return $this->owner->canUser('removeAgentRelation', $user);
    }

    protected function canUserChangeControl($user = null){
        if($this->hasControl)
            return $this->owner->canUser('removeAgentRelationWithControl', $user);
        else
            return $this->owner->canUser('createAgentRelationWithControl', $user);
    }

    public function _setTarget(\MapasCulturais\Entity $target){
        $this->objectId = $target->id;
    }

}