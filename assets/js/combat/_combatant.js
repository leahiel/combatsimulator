/**
 * The Combatant is the actionable, fully derived, object on the
 * combat field.
 *
 * Currently, this is largely unimplemented: Only what needs to work
 * is currently functional.
 */
class Combatant {
    constructor(obj) {
        // Merge our obj onto default, then merge those onto this.
        jQuery.extend(true, this, /* DEFAULTCOMBATANT, */ obj);

        this.original = cloneDeep(obj);
        this.buffs = [];

        this.health = this.healthMax;

        let max = this.initStart * (1 + this.initVariance);
        let min = this.initStart * (1 - this.initVariance);
        this.init = Math.floor(Math.random() * (max - min + 1)) + Math.floor(min);

        if (!this.attacks) {
            this.attacks = [];
        }

        /**
         * equippables
         */
        if (this.equippables) {
            for (let equippable in this.equippables) {
                // Add attacks to Combatant.
                if (this.equippables[equippable].attacks) {
                    this.attacks = mergeArray(this.attacks, this.equippables[equippable].attacks);
                }

                // Don't try to add affixes for unequipped slots.
                if (this.equippables[equippable].type === "unequipped") {
                    continue;
                }

                // Update Combatant Properties with Equippable Properties
                function updateProperties(combatant, equip, propobjname) {
                    Object.keys(combatant[propobjname]).forEach(function (prop) {
                        combatant[propobjname][prop] += equip[propobjname][prop];
                    });
                }

                let item = this.equippables[equippable];

                updateProperties(this, item, "absorbPercent");
                updateProperties(this, item, "absorbPercentMax");
                updateProperties(this, item, "absorbFlat");

                updateProperties(this, item, "resistance");
                updateProperties(this, item, "resistanceMax");
                updateProperties(this, item, "reduct");

                updateProperties(this.damage, item.damage, "blunt");
                updateProperties(this.damage, item.damage, "pierce");
                updateProperties(this.damage, item.damage, "acid");
                updateProperties(this.damage, item.damage, "fire");
                updateProperties(this.damage, item.damage, "frost");
                updateProperties(this.damage, item.damage, "lightning");
                updateProperties(this.damage, item.damage, "sacred");
                updateProperties(this.damage, item.damage, "shadow");
                updateProperties(this.damage, item.damage, "aether");

                this.criticalChanceBase += item.criticalChanceBase;
                this.criticalChanceIncreased += item.criticalChanceIncreased;
                this.criticalChanceMore *= item.criticalChanceMore;
                this.criticalDamageBase += item.criticalDamageBase;
                this.criticalDamageIncreased += item.criticalDamageIncreased;
                this.criticalDamageMore *= item.criticalDamageMore;

                this.directChanceBase += item.directChanceBase;
                this.directChanceIncreased += item.directChanceIncreased;
                this.directChanceMore *= item.directChanceMore;

                this.blockChanceBase += item.blockChanceBase;
                this.blockChanceIncreased += item.blockChanceIncreased;
                this.blockChanceMore *= item.blockChanceMore;

                this.deflectChanceBase += item.deflectChanceBase;
                this.deflectChanceIncreased += item.deflectChanceIncreased;
                this.deflectChanceMore *= item.deflectChanceMore;

                // // Apply equippable affix stats to Combatant.
                // // NTS: This is very outdated code, and shouldn't be used, but I left it in as I may leave in affixes on equippables to be applied directly to combatant instead of the equipable. For instance, "n% increased global critical strike chance".
                // for (let i = 0; i < mod.affixes.length; i++) {
                //     jQuery.extend(
                //         true,
                //         this,
                //         updateProperty(this, mod.affixes[i][0], mod.value[i], mod.affixes[i][1])
                //     );
                // }
            }
        }

        /**
         * Calculate aggregate defensive properties here.
         */
        this.deflectCalculated = this.deflectChanceBase * this.deflectChanceIncreased * this.deflectChanceMore;
        this.blockCalculated = this.blockChanceBase * this.blockChanceIncreased * this.blockChanceMore;

        /**
         * NYI: Monster Rarities.
         */
        if (this.family === "player") {
            this.rarity = "Player";
        } else {
            this.rarity = "Normal";
        }
    }

    /**
     * Buffs and debuffs can change the stats of Combatants, however,
     * when they expire, the stats need to be reassigned.
     *
     * To do this, we will simply remake the Combatant, but certain
     * values must remain the same:
     *
     * Current Health [Maximum amount equal to healthMax]
     * Current Init
     * Current Buffs
     * Current Debuffs
     */
    reform() {
        let newBaseObj = cloneDeep(this.original);
        let oldCombatant = cloneDeep(this);

        Object.assign(this, newBaseObj);

        // Keep health the same.
        if (this.health > this.healthMax) {
            this.health = healthMax;
        }

        // Keep init the same.
        // No code needed.

        // Keep buffs and debuffs the same.
        this.buffs = oldCombatant.buffs;
    }

    /**
     * Convert the data into a string so that the player can understand the data within.
     *
     * This can be HTML text.
     */
    getInfo() {
        let solstr = "";

        // misc info
        solstr += `<span id='infoName'>${this.name}</span>`;
        solstr += `<span id='infoVariant'>#${this.rarity}</span>`; // NYI: Different colors for different rarities.
        solstr += `<span class='divider'></span>`;

        // special info
        // For uncommon stat thingies. "Absorbs Elemental."  We could also put the rarity affix info here?

        // metrics info
        if (this.family === "player") {
            solstr += `<span id='infoMetrics'><span class='infoSectionHeader'>METRICS</span>`;
            solstr += `<grid id='infoMetricsGrid'>`;
            solstr += `<span id='infoHealth'>Health: ${Math.floor(this.health)} / ${Math.floor(this.healthMax)}</span>`;
            solstr += `<span id='init'>Init: ${Math.floor(this.init)}</span>`;
            solstr += `<span id='blockDeflect'>Block: ${Math.floor(this.blockCalculated * 100)}% Deflect: ${Math.floor(
                this.deflectCalculated * 100
            )}%</span>`;
            solstr += `</grid></span>`;
        }

        // resistances info
        solstr += `<span id='infoResistances'><span class='infoSectionHeader'>RESISTANCES</span>`;
        solstr += `<grid id='infoResistanceGrid'>`;
        solstr += `<span style="font-weight:bold">Material</span>`;
        solstr += `<span>Blunt: ${Math.floor(
            Math.min(this.resistance.material + this.resistance.blunt, this.resistanceMax.blunt) * 100
        )}%</span>`;
        solstr += `<span>Pierce: ${Math.floor(
            Math.min(this.resistance.material + this.resistance.pierce, this.resistanceMax.pierce) * 100
        )}%</span>`;
        solstr += `<span>Acid: ${Math.floor(
            Math.min(this.resistance.material + this.resistance.acid, this.resistanceMax.acid) * 100
        )}%</span>`;

        solstr += `<span style="font-weight:bold">Elemental</span>`;
        solstr += `<span>Fire: ${Math.floor(
            Math.min(this.resistance.elemental + this.resistance.fire, this.resistanceMax.fire) * 100
        )}%</span>`;
        solstr += `<span>Frost: ${Math.floor(
            Math.min(this.resistance.elemental + this.resistance.frost, this.resistanceMax.frost) * 100
        )}%</span>`;
        solstr += `<span>Lightning: ${Math.floor(
            Math.min(this.resistance.elemental + this.resistance.lightning, this.resistanceMax.lightning) * 100
        )}%</span>`;

        solstr += `<span style="font-weight:bold">Occult</span>`;
        solstr += `<span>Sacred: ${Math.floor(
            Math.min(this.resistance.occult + this.resistance.sacred, this.resistanceMax.sacred) * 100
        )}%</span>`;
        solstr += `<span>Shadow: ${Math.floor(
            Math.min(this.resistance.occult + this.resistance.shadow, this.resistanceMax.shadow) * 100
        )}%</span>`;
        solstr += `<span>Aether: ${Math.floor(
            Math.min(this.resistance.occult + this.resistance.aether, this.resistanceMax.aether) * 100
        )}%</span>`;
        solstr += `</grid></span>`;

        // buffs & debuffs
        // NYI buff and debuff icons

        // flavor text
        if (!(this.family === "player")) {
            solstr += `<span class='infoSectionHeader'>FLAVOR</span>`;
            solstr += `<grid><span>${this.description}</span></grid>`;
        }

        return solstr;
    }
}

// Add the Combatant class to setup.
(function (S) {
    if (!S.COM) {
        S.COM = {};
    }

    S.COM.Combatant = Combatant;
})(setup);
