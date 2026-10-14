/** A reward of a quest's public definition: xp {amount}, items {items: [{item, quantity}]}, or a kind the client does not draw yet. */
export interface IQuestRewardDefinition
{
    readonly kind: string;
    readonly amount?: number;
    readonly items?: readonly {item: string; quantity: number}[];
}
