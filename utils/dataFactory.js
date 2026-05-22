import { faker } from '@faker-js/faker';

const PREFIX = '[QA-E2E]';

faker.setLocale('es');

export class DataFactory {
  static mediaTitle() {
    return `${PREFIX} Video ${faker.word.adjective()} ${faker.string.uuid().slice(0, 8)}`;
  }

  static adName() {
    return `${PREFIX} Ad ${faker.company.catchPhraseNoun()} ${faker.string.uuid().slice(0, 8)}`;
  }

  static vastUrl() {
    return 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpostpod&cmsid=496&vid=short_onecue&correlator=';
  }

  static vmapUrl() {
    return 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpost&cmsid=496&vid=short_tencue&correlator=';
  }

  static livestreamName() {
    return `${PREFIX} Live ${faker.location.city()} ${faker.string.uuid().slice(0, 8)}`;
  }

  static customerEmail() {
    return `qa-e2e-${faker.string.uuid().slice(0, 8)}@test-qa.com`;
  }

  static customerName() {
    return `${PREFIX} ${faker.person.firstName()} ${faker.person.lastName()}`;
  }

  static showTitle() {
    return `${PREFIX} Show ${faker.word.noun()} ${faker.string.uuid().slice(0, 8)}`;
  }

  static seasonTitle() {
    return `${PREFIX} Season ${faker.number.int({ min: 1, max: 10 })}`;
  }

  static episodeTitle() {
    return `${PREFIX} Episodio ${faker.number.int({ min: 1, max: 20 })} - ${faker.word.noun()}`;
  }

  static channelName() {
    return `${PREFIX} Channel ${faker.word.adjective()} ${faker.string.uuid().slice(0, 8)}`;
  }

  static categoryName() {
    return `${PREFIX} Category ${faker.word.noun()} ${faker.string.uuid().slice(0, 8)}`;
  }

  static playerName() {
    return `${PREFIX} Player ${faker.word.adjective()} ${faker.string.uuid().slice(0, 8)}`;
  }

  static generateMediaPayload() {
    return {
      title: this.mediaTitle(),
      description: faker.lorem.sentence(),
      tags: [faker.word.noun(), faker.word.noun()],
    };
  }

  static generateAdPayload(type = 'VAST') {
    return {
      name: this.adName(),
      type,
      vast_url: type === 'VAST' ? this.vastUrl() : undefined,
      vmap_url: type === 'VMAP' ? this.vmapUrl() : undefined,
    };
  }

  static generateLiveStreamPayload() {
    return {
      name: this.livestreamName(),
      description: faker.lorem.sentence(),
    };
  }

  static generateCustomerPayload() {
    return {
      email: this.customerEmail(),
      name: this.customerName(),
    };
  }

  static generateShowPayload() {
    return {
      title: this.showTitle(),
      description: faker.lorem.sentence(),
    };
  }

  static generateChannelPayload() {
    return {
      name: this.channelName(),
      description: faker.lorem.sentence(),
    };
  }
}
