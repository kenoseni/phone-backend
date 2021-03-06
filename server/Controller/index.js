import BuyRequest from "../Database/models/BuyRequest";
import SellRequest from "../Database/models/SellRequest";
import seeder from "../Database/seeder/seedCsv.js";

class Phone {
  static welcome(req, res) {
    res.status(200).json({ message: "Welcome to Phone" });
  }

  static async getAllPhones(req, res) {
    const { type, limit, page, min, max, searchString } = req.query;

    const query = {
      price: { $gte: min, $lte: max },
    };

    if (query.price["$gte"] === undefined) delete query.price;

    const values = {
      type,
      limit: Number(limit) || 5,
      page: Number(page) || 1,
      searchString,
      query,
    };

    const phoneData = searchString
      ? await Phone.searchFunction(values)
      : await Phone.filterPriceSearch(values);

    return res.status(200).json({
      phoneData,
    });
  }

  static async searchFunction(searchData) {
    const getPhone = { buyer: BuyRequest, seller: SellRequest };
    const search = await getPhone[searchData.type]
      .find(
        { $text: { $search: searchData.searchString } },
        { score: { $meta: "textScore" } }
      )
      .skip((searchData.page - 1) * searchData.limit)
      .limit(searchData.limit * 1)
      .sort({ score: { $meta: "textScore" } });

    const totalResult = await getPhone[searchData.type]
      .find(
        { $text: { $search: searchData.searchString } },
        { score: { $meta: "textScore" } }
      )
      .countDocuments();
    return Phone.handleResponse(search, totalResult, searchData);
  }

  static async filterPriceSearch(searchData) {
    const getPhone = { buyer: BuyRequest, seller: SellRequest };
    const phone = await getPhone[searchData.type]
      .find(searchData.query)
      .skip((searchData.page - 1) * searchData.limit)
      .limit(searchData.limit * 1)
      .sort({ field_key: -1 });

    const totalResult = await getPhone[searchData.type]
      .find(searchData.query)
      .countDocuments();

    return Phone.handleResponse(phone, totalResult, searchData);
  }

  static handleResponse(search, totalResult, searchData) {
    return {
      message: "success",
      docs: search,
      totalPages: Math.ceil(totalResult / searchData.limit),
      searchPhrase: searchData.searchString,
      limit: searchData.limit,
      page: searchData.page,
      type: searchData.type,
    };
  }

  static async updateDBFromExcel(req, res) {
    try {
      console.log("them click me");
      const seedFile = await seeder();
      res.status(200).json({
        message: "success",
        seedFile,
        data: "Database updated Succesfully",
      });
    } catch (error) {
      res.status(400).json({
        message: "failure",
        error,
        data: "Database updated Failed",
      });
    }
  }
}

export default Phone;
