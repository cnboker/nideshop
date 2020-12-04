const Base = require('./base.js');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

module.exports = class extends Base {
  async getAction() {
    const filename = this.get('restore');
    return this.json([
      {
        url: `http://${this.ctx.host}/static/upload/product/${filename}`
      }
    ]);
  }

  async postAction() {
    const imageFiles = this.file('files');
    if (think.isEmpty(imageFiles)) {
      return this.fail('保存失败');
    }

    // const yyyymm = this.getYYYYMM();
    const dir = `/www/static/upload/images/`;

    this.createDir(think.ROOT_PATH + dir);
    this.createDir(think.ROOT_PATH + dir + '/thumbnail');
    const filename = this.ctx.header['filename'];

    const is = fs.createReadStream(imageFiles.path);
    const phdir = think.ROOT_PATH + dir + filename;
    const os = fs.createWriteStream(phdir);
    is.pipe(os);

    is.on('end', async() => {
      // console.log('end of readStream'+fileName);
      await this.thumbnail(phdir);
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

  async resizeImage(readstream, writeSteam, {width, height}) {
    // const roundedCorners = Buffer.from(`<svg><rect x="0" y="0" width="${width}" height="${height}" rx="5" ry="5"/></svg>`);

    const roundedCornerResizer = await sharp()
      .resize(width, height)
      .webp({ quality: 80 })
      // .composite([
      //   {
      //     input: roundedCorners,
      //     blend: 'dest-in'
      //   }
      // ])
      .jpeg();
    readstream
      .pipe(roundedCornerResizer)
      .pipe(writeSteam);
  }

  async thumbnail(origin) {
    // console.log('origin file=', origin);
    const targetPath = `${path.dirname(origin)}/thumbnail/${path.basename(origin)}`;
    const rs = fs.createReadStream(origin);
    const ws = fs.createWriteStream(targetPath);
    this.resizeImage(rs, ws, {
      width: 200,
      height: 220 * 1.4
    });
    // await sharp(origin)   .resize(200, 200, {fit: 'cover'})
    // .toFile(targetPath);
  }
};
