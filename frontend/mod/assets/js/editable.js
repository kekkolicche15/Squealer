export class Editable {
  constructor(fields, data) {
    this.fields = fields;
    this.setFields(data);
  }

  setFields(data) {
    this.fields.forEach((key) => {
      if (key in data) {
        this[key] = data[key];
      }
    });
  }

  getDiffs(data) {
    return data.filter(
      (e) => this[e.field] !== undefined && e.value !== this[e.field],
    );
  }

  cd2String() {
    if (!this.creationDate) return "Non disponibile";
    const comp = new Date(this.creationDate)
      .toISOString()
      .substring(0, 10)
      .split("-");
    return `${comp[2]}-${comp[1]}-${comp[0]}`;
  }
}
