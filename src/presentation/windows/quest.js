import { Window_Base } from './base.js';
import { createInteractiveLabel } from './components.js';

export class Window_Quest extends Window_Base {
  constructor(x, y, width, height) {
    super(x, y, width, height, { title: 'Quest Offer' });
    this.content.style.display = 'flex';
    this.content.style.flexDirection = 'column';
    this.content.style.gap = '10px';
    this.content.style.padding = '10px';
  }

  showOffer(quest, onAccept, onDecline) {
    this.content.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.textContent = quest.title;
    title.style.fontSize = '18px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.color = '#ffd700'; // Gold
    this.content.appendChild(title);

    // Description
    const desc = document.createElement('div');
    desc.textContent = quest.description;
    desc.style.marginBottom = '15px';
    desc.style.lineHeight = '1.4';
    this.content.appendChild(desc);

    // Rewards
    if (quest.rewards && quest.rewards.length > 0) {
      const rewardsLabel = document.createElement('div');
      rewardsLabel.textContent = 'Rewards:';
      rewardsLabel.style.fontWeight = 'bold';
      rewardsLabel.style.marginBottom = '5px';
      this.content.appendChild(rewardsLabel);

      const rewardsList = document.createElement('div');
      rewardsList.style.display = 'flex';
      rewardsList.style.flexDirection = 'column';
      rewardsList.style.gap = '5px';
      rewardsList.style.marginBottom = '15px';

      quest.rewards.forEach(reward => {
        const rewardEl = document.createElement('div');
        rewardEl.textContent = `• ${reward.text}`;
        rewardEl.style.color = '#aaffaa';
        rewardsList.appendChild(rewardEl);
      });
      this.content.appendChild(rewardsList);
    }

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = 'auto';
    buttonContainer.style.gap = '10px';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'win-btn';
    acceptBtn.textContent = 'Accept';
    acceptBtn.style.flex = '1';
    acceptBtn.onclick = () => {
      onAccept();
      this.close();
    };

    const declineBtn = document.createElement('button');
    declineBtn.className = 'win-btn';
    declineBtn.textContent = 'Decline';
    declineBtn.style.flex = '1';
    declineBtn.onclick = () => {
      onDecline();
      this.close();
    };

    buttonContainer.appendChild(acceptBtn);
    buttonContainer.appendChild(declineBtn);
    this.content.appendChild(buttonContainer);

    this.show();

    // Focus accept button by default
    setTimeout(() => acceptBtn.focus(), 0);
  }
}
