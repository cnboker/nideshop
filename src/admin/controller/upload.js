const Base = require('./base.js');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

module.exports = class extends Base {
  async getAction() {
    const filename = this.get('restore');
    return this.json([{url: `http://${this.ctx.host}/static/upload/product/${filename}`}]);
  }

  async postAction() {
    const productFile = this.file('files');
    if (think.isEmpty(productFile)) {
      return this.fail('保存失败');
    }

    // const yyyymm = this.getYYYYMM();
    const dir = `/www/static/upload/images/`;

    this.createDir(think.ROOT_PATH + dir);
    this.createDir(think.ROOT_PATH + dir + '/thumbnail');
    const filename = this.ctx.header['filename'];

    const is = fs.createReadStream(productFile.path);
    const phdir = think.ROOT_PATH + dir + filename;
    const os = fs.createWriteStream(phdir);
    is.pipe(os);
    const self = this;
    is.on('end', async function() {
      // console.log('end of readStream'+fileName);
      await self.thumbnail(phdir);
    });

    return this.success({
      name: 'product',
      fileUrl: '/static/upload/product/' + filename
    });
  }

  createDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }
  }

  async thumbnail(origin) {
    // console.log('origin file=', origin);
    await sharp(origin)
      .resize(200, 200, {fit: 'cover'})
      .toFile(`${path.dirname(origin)}/thumbnail/${path.basename(origin)}`);
  }
};
