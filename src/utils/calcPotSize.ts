import { IRound } from "../api/getRounds";
import { IStakingRewads } from "../api/getRoundStakingRewards";
import calcTotalPotSize from "./calcTotalPotSize";

export default (
    currentRound: IRound,
    stakingRewards: IStakingRewads
) => {
    const totalPotSize = calcTotalPotSize(currentRound, stakingRewards);
    const newTokensOnRound = (totalPotSize - parseInt(currentRound.initial_pot_size));
    
    const burn = newTokensOnRound * (currentRound.round_reward_pot_allocations.burn * 0.01)
    const triggerer = newTokensOnRound * (currentRound.round_reward_pot_allocations.triggerer * 0.01)
    const reserve = newTokensOnRound * (currentRound.round_reward_pot_allocations.reserve * 0.01)

    const sequence_pot = totalPotSize - burn - triggerer - reserve

    const sequence1 = sequence_pot * (currentRound.round_reward_pot_allocations.sequence_1 * 0.01)
    const sequence2 = sequence_pot * (currentRound.round_reward_pot_allocations.sequence_2 * 0.01)
    const sequence3 = sequence_pot * (currentRound.round_reward_pot_allocations.sequence_3 * 0.01)
    const sequence4 = sequence_pot * (currentRound.round_reward_pot_allocations.sequence_4 * 0.01)
    const sequence5 = sequence_pot * (currentRound.round_reward_pot_allocations.sequence_5 * 0.01)
    const sequence6 = sequence_pot * (currentRound.round_reward_pot_allocations.sequence_6 * 0.01)

    return {
        burn,
        triggerer,
        reserve,
        sequence1,
        sequence2,
        sequence3,
        sequence4,
        sequence5,
        sequence6
    }
}